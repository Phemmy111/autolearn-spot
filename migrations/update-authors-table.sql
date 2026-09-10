-- Update authors table to support suspension and status management

-- Note: authors.user_id is UUID referencing auth.users(id)
-- author_applications.user_id is TEXT (Clerk sub)
-- We need to add a clerk_user_id column to authors for linking

-- Add clerk_user_id column for Clerk integration
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add status column if it doesn't exist
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'));

-- Add suspension-related columns
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Add email column for notifications
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add professional fields from application
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience TEXT,
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT,
ADD COLUMN IF NOT EXISTS website_portfolio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS expertise TEXT[];

-- Add document URLs
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_samples_url TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Add application_id reference
ALTER TABLE public.authors
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.author_applications(id) ON DELETE SET NULL;

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_authors_status ON public.authors(status);

-- Add index on clerk_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_authors_clerk_user_id ON public.authors(clerk_user_id);
