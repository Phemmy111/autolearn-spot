-- ALEX Phase 3A - Message File Attachments
-- This migration adds file_ids column to alex_messages to track which files were attached to each message

-- Add file_ids column to alex_messages
ALTER TABLE alex_messages 
ADD COLUMN IF NOT EXISTS file_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add index for efficient file_id lookups on messages
CREATE INDEX IF NOT EXISTS idx_alex_messages_file_ids ON alex_messages USING GIN (file_ids);

DO $$
BEGIN
  RAISE NOTICE 'ALEX Phase 3A message attachments migration completed successfully';
  RAISE NOTICE 'Added file_ids column to alex_messages';
  RAISE NOTICE 'Added GIN index for file_ids array';
END $$;
