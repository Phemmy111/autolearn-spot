-- Phase 2 — Author Application and Authorization

CREATE TABLE IF NOT EXISTS public.author_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID (sub)
    full_name TEXT NOT NULL,
    bio TEXT,
    expertise TEXT[],
    experience TEXT,
    portfolio_url TEXT,
    social_links TEXT[],
    credentials TEXT,
    motivation TEXT,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT ''PENDING_REVIEW'' CHECK (status IN (''PENDING_REVIEW'',''APPROVED'',''ACTIVE'',''REJECTED'',''SUSPENDED'')),
    admin_review_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id)
);

-- Enable RLS for author applications
ALTER TABLE public.author_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own application
CREATE POLICY  Authors can view their own application
    ON public.author_applications FOR SELECT USING (auth.jwt() ->> ''sub'' = user_id);

-- Users can insert their own application
CREATE POLICY Authors can insert their own application
    ON public.author_applications FOR INSERT WITH CHECK (auth.jwt() ->> ''sub'' = user_id);

-- Admins can manage all aspects of author applications
CREATE POLICY Admins can manage author applications
    ON public.author_applications FOR ALL USING (auth.jwt() ->> ''role'' = ''admin'' OR auth.jwt() ->> ''role'' = ''super_admin'');
