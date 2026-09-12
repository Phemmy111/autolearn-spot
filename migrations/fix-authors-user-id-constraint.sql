-- Fix authors table for Clerk integration
-- Remove foreign key constraint on user_id since we use clerk_user_id for auth

-- Drop the foreign key constraint
ALTER TABLE public.authors
DROP CONSTRAINT IF EXISTS authors_user_id_fkey;

-- Make user_id nullable
ALTER TABLE public.authors
ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.authors.user_id IS 'Legacy column - no longer used. Use clerk_user_id for Clerk authentication';
