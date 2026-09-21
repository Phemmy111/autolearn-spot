-- Add delivery and read status to author_messages table
ALTER TABLE public.author_messages
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'FAILED')),
ADD COLUMN IF NOT EXISTS read_status VARCHAR(20) DEFAULT 'UNREAD' CHECK (read_status IN ('UNREAD', 'READ')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create index for faster queries on read status
CREATE INDEX IF NOT EXISTS idx_author_messages_read_status ON public.author_messages(read_status);
CREATE INDEX IF NOT EXISTS idx_author_messages_conversation_read ON public.author_messages(conversation_id, read_status);
