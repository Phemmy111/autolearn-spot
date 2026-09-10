-- Update author_applications table to match new form fields

-- Add new columns for detailed author application
ALTER TABLE public.author_applications
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience TEXT,
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT,
ADD COLUMN IF NOT EXISTS website_portfolio TEXT,
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_samples_url TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- Update status values to match new workflow
ALTER TABLE public.author_applications
DROP CONSTRAINT IF EXISTS author_applications_status_check;

ALTER TABLE public.author_applications
ADD CONSTRAINT author_applications_status_check
CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'ACTIVE'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_author_applications_status ON public.author_applications(status);
CREATE INDEX IF NOT EXISTS idx_author_applications_email ON public.author_applications(email);
