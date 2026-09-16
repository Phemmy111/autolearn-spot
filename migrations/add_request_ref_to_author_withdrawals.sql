-- Add request_ref column to author_withdrawals table
-- This column is used to generate unique references for withdrawal requests

ALTER TABLE public.author_withdrawals 
ADD COLUMN IF NOT EXISTS request_ref TEXT UNIQUE;
