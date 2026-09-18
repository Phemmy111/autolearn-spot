-- Migration: Add Author Terms & Conditions Acceptance
-- Phase A: Author Engagement Master

-- Add terms acceptance fields to authors table
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_terms_version TEXT DEFAULT '2026-09-01';

-- Add index for faster queries on terms acceptance
CREATE INDEX IF NOT EXISTS idx_authors_terms_accepted 
ON public.authors(accepted_terms_version, accepted_terms_at) 
WHERE accepted_terms_at IS NOT NULL;

-- Add comment to document the terms version
COMMENT ON COLUMN public.authors.accepted_terms_version IS 'Version of author terms that the author has accepted. Current version: 2026-09-01';
COMMENT ON COLUMN public.authors.accepted_terms_at IS 'Timestamp when author accepted the terms and conditions';
