-- Migration: Author Messaging System
-- Phase B: Author Engagement Master

-- Create message_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VOICE', 'SYSTEM');
  END IF;
END$$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.author_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  learning_product_id UUID NOT NULL REFERENCES public.learning_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, author_id, learning_product_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.author_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.author_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('AUTHOR', 'STUDENT')),
  message_type message_type NOT NULL DEFAULT 'TEXT',
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS public.author_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.author_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  duration_seconds INTEGER, -- For voice notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_author_conversations_student ON public.author_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_author_conversations_author ON public.author_conversations(author_id);
CREATE INDEX IF NOT EXISTS idx_author_conversations_product ON public.author_conversations(learning_product_id);
CREATE INDEX IF NOT EXISTS idx_author_conversations_updated ON public.author_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_author_messages_conversation ON public.author_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_author_messages_sender ON public.author_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_author_messages_created ON public.author_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_author_attachments_message ON public.author_message_attachments(message_id);

-- Add comments
COMMENT ON TABLE public.author_conversations IS 'Conversations between authors and students about specific learning products';
COMMENT ON TABLE public.author_messages IS 'Messages within author-student conversations';
COMMENT ON TABLE public.author_message_attachments IS 'Attachments for author messages (images, documents, voice notes)';

-- Enable Row Level Security
ALTER TABLE public.author_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Authors can view conversations where they are the author
CREATE POLICY "Authors can view own conversations"
  ON public.author_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.authors 
      WHERE authors.id = author_conversations.author_id 
      AND authors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Students can view conversations where they are the student
CREATE POLICY "Students can view own conversations"
  ON public.author_conversations FOR SELECT
  USING (student_id = auth.jwt() ->> 'sub');

-- RLS Policies for messages
-- Authors can view messages in their conversations
CREATE POLICY "Authors can view messages in own conversations"
  ON public.author_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.author_conversations
      JOIN public.authors ON authors.id = author_conversations.author_id
      WHERE author_conversations.id = author_messages.conversation_id
      AND authors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Students can view messages in their conversations
CREATE POLICY "Students can view messages in own conversations"
  ON public.author_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.author_conversations
      WHERE author_conversations.id = author_messages.conversation_id
      AND author_conversations.student_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policies for attachments
-- Authors can view attachments in their messages
CREATE POLICY "Authors can view attachments in own messages"
  ON public.author_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.author_messages
      JOIN public.author_conversations ON author_conversations.id = author_messages.conversation_id
      JOIN public.authors ON authors.id = author_conversations.author_id
      WHERE author_messages.id = author_message_attachments.message_id
      AND authors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Students can view attachments in their messages
CREATE POLICY "Students can view attachments in own messages"
  ON public.author_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.author_messages
      JOIN public.author_conversations ON author_conversations.id = author_messages.conversation_id
      WHERE author_messages.id = author_message_attachments.message_id
      AND author_conversations.student_id = auth.jwt() ->> 'sub'
    )
  );

-- Create function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.author_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_conversation_updated_at
  AFTER INSERT OR UPDATE ON public.author_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();
