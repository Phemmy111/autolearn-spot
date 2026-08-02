-- AutoLearn Spot Growth Engine Redesign - Step 1: Create New Tables
-- This step creates only the new tables without dropping existing ones

-- ============================================
-- PARTNER APPLICATIONS (Community Partners)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_applications_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Required Fields
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  state TEXT NOT NULL,
  occupation TEXT NOT NULL,
  motivation TEXT NOT NULL,
  promotion_method TEXT NOT NULL,
  
  -- Optional Fields
  organization TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  linkedin TEXT,
  youtube TEXT,
  experience TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'need_more_info')),
  
  -- Admin Review
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- PARTNERS (Unified Partner Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partners_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partner Identification
  partner_type TEXT NOT NULL CHECK (partner_type IN ('student', 'community', 'influencer')),
  
  -- For Student Partners (Clerk user_id)
  clerk_user_id TEXT UNIQUE,
  
  -- For Community Partners (own auth)
  community_ambassador_id UUID UNIQUE,
  
  -- For Influencer Partners (own auth)
  influencer_id UUID UNIQUE,
  
  -- Partner Details
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Commission Settings
  commission_rate INTEGER NOT NULL DEFAULT 1500,
  custom_commission_rate INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  
  -- Statistics
  total_clicks INTEGER DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  total_payments_initiated INTEGER DEFAULT 0,
  total_successful_purchases INTEGER DEFAULT 0,
  
  -- Earnings
  pending_earnings INTEGER DEFAULT 0,
  available_earnings INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  total_withdrawn INTEGER DEFAULT 0,
  
  -- Referral Code
  referral_code_id UUID UNIQUE,
  
  -- Status Change Tracking
  status_changed_by TEXT,
  status_changed_at TIMESTAMP WITH TIME ZONE,
  status_change_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- COMMUNITY AMBASSADORS (Separate Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_ambassadors_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Profile
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  state TEXT,
  occupation TEXT,
  organization TEXT,
  
  -- Partner Link
  partner_id UUID UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INFLUENCERS (Separate Auth, Admin-Created)
-- ============================================
CREATE TABLE IF NOT EXISTS public.influencers_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Profile
  full_name TEXT NOT NULL,
  phone TEXT,
  
  -- Platform Details
  platform TEXT NOT NULL,
  followers TEXT,
  category TEXT,
  
  -- Commission
  commission_rate INTEGER NOT NULL DEFAULT 2500,
  
  -- Partner Link
  partner_id UUID UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  
  -- Admin Tracking
  created_by TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PARTNER BANK PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_bank_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partner Link
  partner_id UUID NOT NULL,
  
  -- Bank Details
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure one bank profile per partner
  UNIQUE(partner_id)
);

-- ============================================
-- FRAUD ALERTS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.fraud_alerts_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'self_referral', 
    'duplicate_email', 
    'duplicate_phone', 
    'duplicate_ip', 
    'referral_loop', 
    'excessive_fake_registrations', 
    'rapid_click_abuse',
    'manual_flag'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  user_id TEXT,
  related_entity_id TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- ============================================
-- PARTNER NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- GROWTH ANALYTICS (Daily Snapshots)
-- ============================================
CREATE TABLE IF NOT EXISTS public.growth_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  total_payments INTEGER DEFAULT 0,
  total_commission_amount INTEGER DEFAULT 0,
  total_withdrawals INTEGER DEFAULT 0,
  total_withdrawal_amount INTEGER DEFAULT 0,
  active_partners INTEGER DEFAULT 0,
  student_partners INTEGER DEFAULT 0,
  community_partners INTEGER DEFAULT 0,
  influencer_partners INTEGER DEFAULT 0,
  fraud_alerts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- EMAIL HISTORY (Partner System)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_email_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);