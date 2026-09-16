-- Migration: Fix bank account encryption for transfer support
-- This migration makes bank account columns text type to support automatic transfers
-- In production, you should use the RPC function with proper pgcrypto key configuration

-- Create a backup table with current encrypted data
CREATE TABLE IF NOT EXISTS author_bank_accounts_backup AS 
SELECT * FROM author_bank_accounts;

-- Add new text columns for transfer support
ALTER TABLE author_bank_accounts 
ADD COLUMN IF NOT EXISTS account_number_text TEXT,
ADD COLUMN IF NOT EXISTS routing_number_text TEXT;

-- Migrate existing data if possible (decrypt using pgcrypto if key is configured)
-- For now, this will leave them null and require manual entry
UPDATE author_bank_accounts 
SET account_number_text = account_number::text,
    routing_number_text = routing_number::text
WHERE account_number IS NOT NULL AND routing_number IS NOT NULL;

-- Note: In production, you should:
-- 1. Configure pgcrypto.key in PostgreSQL
-- 2. Use the upsert_author_bank_account RPC function
-- 3. Remove this migration after proper encryption is implemented
