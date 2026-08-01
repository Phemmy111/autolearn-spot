-- AutoLearn Spot Growth Engine Milestone 1 Schema
-- Create Referral Codes and Referral Clicks tables

-- 1. Create Referral Codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id TEXT NOT NULL, -- Clerk User ID
    code VARCHAR(8) UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Inactive
    total_clicks INTEGER DEFAULT 0,
    total_registrations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Referral Clicks table (optional, but good for tracking where clicks came from)
CREATE TABLE IF NOT EXISTS public.referral_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code VARCHAR(8) NOT NULL REFERENCES public.referral_codes(code) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referrer_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Add referred_by_code to scholarship_applications
ALTER TABLE public.scholarship_applications 
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(8);

-- 4. Ensure enrollments table has referred_by_code (if it doesn't already)
-- Note: Assuming enrollments already has it based on standard practice, but we'll add it just in case.
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(8);

-- 5. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Admins can read all referral codes
CREATE POLICY "Admins can read all referral codes"
ON public.referral_codes
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Users can read their own referral codes
CREATE POLICY "Users can read own referral codes"
ON public.referral_codes
FOR SELECT
USING (auth.jwt() ->> 'sub' = owner_id);

-- Admins can update referral codes
CREATE POLICY "Admins can update referral codes"
ON public.referral_codes
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Admins can read all clicks
CREATE POLICY "Admins can read all referral clicks"
ON public.referral_clicks
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_owner ON public.referral_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_referral_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_clicks_code ON public.referral_clicks(referral_code);
