-- AutoLearn Spot Scholarship Programme Schema
-- Run this in Supabase SQL Editor

-- 0. Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Scholarship Applications Table
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    
    -- Step 1: Personal Info
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    occupation TEXT NOT NULL,
    
    -- Step 2: Tech Background
    ai_experience TEXT NOT NULL,
    automation_experience TEXT NOT NULL,
    has_laptop BOOLEAN NOT NULL,
    has_internet BOOLEAN NOT NULL,
    
    -- Step 3: Motivation
    motivation TEXT NOT NULL,
    goals TEXT NOT NULL,
    impact TEXT NOT NULL,
    why_you TEXT NOT NULL,
    
    -- Step 4: Commitment
    commitment_confirmed BOOLEAN NOT NULL,
    
    -- Admin & Status
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Scholarship OTPs Table (For secure status checking)
CREATE TABLE IF NOT EXISTS public.scholarship_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_otps ENABLE ROW LEVEL SECURITY;

-- Applications: Admins can do everything. Public can insert via service role (Server Actions).
-- We'll just allow authenticated admins to read/update.
CREATE POLICY "Admins can read all applications"
ON public.scholarship_applications
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update applications"
ON public.scholarship_applications
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- OTPs: Service role key bypasses RLS, so no policies needed for server actions.
-- This ensures only server-side operations can access OTPs.

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scholarship_email ON public.scholarship_applications(email);
CREATE INDEX IF NOT EXISTS idx_scholarship_ref ON public.scholarship_applications(reference_number);
CREATE INDEX IF NOT EXISTS idx_scholarship_status ON public.scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.scholarship_otps(email);
