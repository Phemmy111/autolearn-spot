-- AutoLearn Spot Growth Engine Redesign Schema
-- Complete redesign for Student, Community, and Influencer Partners
-- This schema supports the new business model with ₦8,000 course price

-- ============================================
-- DROP EXISTING TABLES (Clean Slate)
-- ============================================
DROP TABLE IF EXISTS public.partner_applications CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.ambassador_applications CASCADE;
DROP TABLE IF EXISTS public.ambassadors CASCADE;
DROP TABLE IF EXISTS public.community_ambassadors CASCADE;
DROP TABLE IF EXISTS public.influencers CASCADE;

-- ============================================
-- PARTNER APPLICATIONS (Community Partners)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_applications (
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
CREATE TABLE IF NOT EXISTS public.partners (
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
  commission_rate INTEGER NOT NULL DEFAULT 1500, -- ₦1,500 default for student/community
  custom_commission_rate INTEGER, -- For customized influencer rates
  
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
  referral_code_id UUID UNIQUE REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  
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
CREATE TABLE IF NOT EXISTS public.community_ambassadors (
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
  partner_id UUID UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  
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
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Profile
  full_name TEXT NOT NULL,
  phone TEXT,
  
  -- Platform Details
  platform TEXT NOT NULL, -- TikTok, YouTube, Facebook, etc.
  followers TEXT,
  category TEXT, -- Tech, Education, Lifestyle, etc.
  
  -- Commission
  commission_rate INTEGER NOT NULL DEFAULT 2500, -- ₦2,500 default for influencers
  
  -- Partner Link
  partner_id UUID UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  
  -- Admin Tracking
  created_by TEXT, -- Admin user_id who created this influencer
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PARTNER BANK PROFILES (One-time bank details)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_bank_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partner Link
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  
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
-- REFERRAL CODES (Updated)
-- ============================================
-- Ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  owner_type TEXT NOT NULL DEFAULT 'student' CHECK (owner_type IN ('student', 'community', 'influencer')),
  total_clicks INTEGER DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- REFERRAL CLICKS (Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- COMMISSIONS (Updated for new rates)
-- ============================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referrer_type TEXT NOT NULL CHECK (referrer_type IN ('student', 'community', 'influencer')),
  referee_email TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawing', 'paid', 'reversed')),
  holding_period_ends_at TIMESTAMP WITH TIME ZONE,
  reversal_reason TEXT,
  withdrawal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- WITHDRAWALS (Updated)
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'community', 'influencer')),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  payment_reference TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- WITHDRAWAL COMMISSIONS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawal_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(withdrawal_id, commission_id)
);

-- ============================================
-- FRAUD ALERTS (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
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
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Partner Applications
CREATE INDEX IF NOT EXISTS idx_partner_app_email ON public.partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_app_status ON public.partner_applications(status);

-- Partners
CREATE INDEX IF NOT EXISTS idx_partners_clerk_user ON public.partners(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_partners_community_id ON public.partners(community_ambassador_id);
CREATE INDEX IF NOT EXISTS idx_partners_influencer_id ON public.partners(influencer_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);

-- Community Ambassadors
CREATE INDEX IF NOT EXISTS idx_comm_amb_email ON public.community_ambassadors(email);
CREATE INDEX IF NOT EXISTS idx_comm_amb_partner ON public.community_ambassadors(partner_id);

-- Influencers
CREATE INDEX IF NOT EXISTS idx_inf_email ON public.influencers(email);
CREATE INDEX IF NOT EXISTS idx_inf_partner ON public.influencers(partner_id);
CREATE INDEX IF NOT EXISTS idx_inf_platform ON public.influencers(platform);

-- Partner Bank Profiles
CREATE INDEX IF NOT EXISTS idx_bank_profile_partner ON public.partner_bank_profiles(partner_id);

-- Referral Codes
CREATE INDEX IF NOT EXISTS idx_referral_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_owner ON public.referral_codes(owner_id, owner_type);

-- Referral Clicks
CREATE INDEX IF NOT EXISTS idx_ref_click_code ON public.referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_ref_click_ip ON public.referral_clicks(ip_address);

-- Commissions
CREATE INDEX IF NOT EXISTS idx_comm_referrer ON public.commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_comm_payment ON public.commissions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_comm_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_comm_holding ON public.commissions(holding_period_ends_at);

-- Withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON public.withdrawals(status);

-- Fraud Alerts
CREATE INDEX IF NOT EXISTS idx_fraud_status ON public.fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_user ON public.fraud_alerts(user_id);

-- Partner Notifications
CREATE INDEX IF NOT EXISTS idx_notif_partner ON public.partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON public.partner_notifications(read);

-- Growth Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.growth_analytics(snapshot_date);

-- Email History
CREATE INDEX IF NOT EXISTS idx_email_recipient ON public.partner_email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_type ON public.partner_email_history(email_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Partner Applications
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage partner applications" ON public.partner_applications
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
CREATE POLICY "Students can read own partner profile" ON public.partners
  FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Community Ambassadors
ALTER TABLE public.community_ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage community ambassadors" ON public.community_ambassadors
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Influencers
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage influencers" ON public.influencers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partner Bank Profiles
ALTER TABLE public.partner_bank_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bank profiles" ON public.partner_bank_profiles
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Fraud Alerts
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partner Notifications
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can read own notifications" ON public.partner_notifications
  FOR SELECT USING (partner_id IN (
    SELECT id FROM public.partners WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));
CREATE POLICY "Admins can manage notifications" ON public.partner_notifications
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Growth Analytics
ALTER TABLE public.growth_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read analytics" ON public.growth_analytics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Email History
ALTER TABLE public.partner_email_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email history" ON public.partner_email_history
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_ambassadors_updated_at BEFORE UPDATE ON public.community_ambassadors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_bank_profiles_updated_at BEFORE UPDATE ON public.partner_bank_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.partner_applications IS 'Applications for Community Partner program';
COMMENT ON TABLE public.partners IS 'Unified partner table for all partner types';
COMMENT ON TABLE public.community_ambassadors IS 'Community partners with separate authentication';
COMMENT ON TABLE public.influencers IS 'Influencer partners with separate authentication, admin-created';
COMMENT ON TABLE public.partner_bank_profiles IS 'Bank details for partners (one per partner)';
COMMENT ON TABLE public.commissions IS 'Commission records for successful referrals';
COMMENT ON TABLE public.withdrawals IS 'Withdrawal requests from partners';
COMMENT ON TABLE public.withdrawal_commissions IS 'Junction table linking withdrawals to commissions';
COMMENT ON TABLE public.fraud_alerts IS 'Fraud detection alerts for admin review';
COMMENT ON TABLE public.partner_notifications IS 'In-app notifications for partners';
COMMENT ON TABLE public.growth_analytics IS 'Daily analytics snapshots for growth metrics';
COMMENT ON TABLE public.partner_email_history IS 'History of emails sent to partners';

COMMENT ON COLUMN public.partners.commission_rate IS 'Default commission rate (1500 for student/community, 2500 for influencer)';
COMMENT ON COLUMN public.partners.custom_commission_rate IS 'Custom commission rate for specific partners (e.g., special influencer deals)';
COMMENT ON COLUMN public.commissions.holding_period_ends_at IS '7-day holding period after which commission becomes available';
COMMENT ON COLUMN public.fraud_alerts.severity IS 'Severity level: low, medium, or high';
