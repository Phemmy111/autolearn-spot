-- AutoLearn Spot Growth Engine Milestone 3 Schema
-- Commission Engine tables

-- 1. Create Commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id TEXT NOT NULL,                    -- Clerk User ID of the referrer
    referrer_type TEXT NOT NULL DEFAULT 'student', -- student, campus_ambassador, partner_ambassador
    referee_email TEXT NOT NULL,                   -- Email of the referred student
    referral_code VARCHAR(8) NOT NULL,            -- The referral code used
    payment_reference TEXT NOT NULL UNIQUE,        -- Paystack payment reference (idempotency key)
    amount INTEGER NOT NULL DEFAULT 1000,          -- Commission amount in Naira
    status TEXT NOT NULL DEFAULT 'pending',         -- pending, available, withdrawing, paid, reversed
    holding_period_ends_at TIMESTAMP WITH TIME ZONE, -- 7 days after creation
    reversal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Row Level Security
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own commissions
CREATE POLICY "Users can read own commissions"
ON public.commissions
FOR SELECT
USING (auth.jwt() ->> 'sub' = referrer_id);

-- Admins can read all commissions
CREATE POLICY "Admins can read all commissions"
ON public.commissions
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Admins can update commissions
CREATE POLICY "Admins can update commissions"
ON public.commissions
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON public.commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_ref ON public.commissions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_code ON public.commissions(referral_code);
CREATE INDEX IF NOT EXISTS idx_commissions_holding ON public.commissions(holding_period_ends_at);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON public.commissions(created_at DESC);
