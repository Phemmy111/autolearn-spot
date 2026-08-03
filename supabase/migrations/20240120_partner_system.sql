-- AutoLearn Spot Partner System Database Schema
-- This file contains all tables, indexes, foreign keys, RLS policies, triggers, and views for the partner system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PARTNERS TABLE
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  state VARCHAR(100),
  occupation VARCHAR(100),
  partner_type VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student', 'community', 'corporate'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'pending', 'rejected'
  commission_rate DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
  passport_url TEXT,
  organization VARCHAR(255),
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  linkedin TEXT,
  youtube TEXT,
  experience TEXT,
  motivation TEXT,
  promotion_method TEXT,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  available_balance DECIMAL(10, 2) DEFAULT 0.00,
  pending_earnings DECIMAL(10, 2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_withdrawals DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- PARTNER APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  state VARCHAR(100) NOT NULL,
  occupation VARCHAR(100) NOT NULL,
  partner_type VARCHAR(50) NOT NULL DEFAULT 'community',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  passport_url TEXT,
  organization VARCHAR(255),
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  linkedin TEXT,
  youtube TEXT,
  experience TEXT,
  motivation TEXT NOT NULL,
  promotion_method TEXT NOT NULL,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNER REFERRALS TABLE
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  referred_email VARCHAR(255),
  referred_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'clicked', -- 'clicked', 'registered', 'enrolled', 'completed'
  click_count INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  first_clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registered_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner_id, referral_code)
);

-- PARTNER COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS partner_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES partner_referrals(id) ON DELETE SET NULL,
  enrollment_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'reversed'
  commission_rate DECIMAL(10, 2) NOT NULL,
  enrollment_amount DECIMAL(10, 2),
  holding_period_days INTEGER DEFAULT 7,
  holding_end_date TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  reversal_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNER WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS partner_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNER ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS partner_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- 'login', 'referral_click', 'commission_earned', 'withdrawal_requested', etc.
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNER MARKETING DOWNLOADS TABLE
CREATE TABLE IF NOT EXISTS partner_marketing_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) NOT NULL, -- 'flyer', 'video', 'poster', 'guide', etc.
  resource_name VARCHAR(255) NOT NULL,
  resource_url TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNER BANK PROFILES TABLE
CREATE TABLE IF NOT EXISTS partner_bank_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner_id)
);

-- PARTNER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(100) NOT NULL, -- 'commission', 'withdrawal', 'application', etc.
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);

CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);

CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_id ON partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_code ON partner_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_status ON partner_referrals(status);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_id ON partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_referral_id ON partner_commissions(referral_id);

CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_partner_id ON partner_withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_status ON partner_withdrawals(status);

CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_partner_id ON partner_activity_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_type ON partner_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_partner_activity_logs_created ON partner_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_partner_marketing_downloads_partner_id ON partner_marketing_downloads(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_marketing_downloads_type ON partner_marketing_downloads(resource_type);

CREATE INDEX IF NOT EXISTS idx_partner_bank_profiles_partner_id ON partner_bank_profiles(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id ON partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_created ON partner_notifications(created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW partner_dashboard_stats AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.partner_type,
  p.status,
  p.commission_rate,
  COUNT(DISTINCT pr.id) as total_clicks,
  COUNT(DISTINCT CASE WHEN pr.status = 'enrolled' THEN pr.id END) as enrollments,
  COUNT(DISTINCT CASE WHEN pr.status = 'clicked' THEN pr.id END) as clicks,
  COUNT(DISTINCT CASE WHEN pr.status = 'registered' THEN pr.id END) as registrations
FROM partners p
LEFT JOIN partner_referrals pr ON p.id = pr.partner_id
WHERE p.status = 'active'
GROUP BY p.id, p.full_name, p.email, p.partner_type, p.status, p.commission_rate;

-- Function to generate partner ID
CREATE OR REPLACE FUNCTION generate_partner_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_id VARCHAR(20);
  prefix VARCHAR(10) := 'ALS';
  suffix VARCHAR(10);
BEGIN
  LOOP
    suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    new_id := prefix || suffix;
    IF NOT EXISTS (SELECT 1 FROM partners WHERE partner_id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  suffix VARCHAR(10);
BEGIN
  LOOP
    suffix := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0');
    new_code := 'REF' || suffix;
    IF NOT EXISTS (SELECT 1 FROM partner_referrals WHERE referral_code = new_code) THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update partner totals
CREATE OR REPLACE FUNCTION update_partner_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      UPDATE partners 
      SET 
        available_balance = available_balance + NEW.amount,
        total_earnings = total_earnings + NEW.amount
      WHERE id = NEW.partner_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      UPDATE partners 
      SET 
        available_balance = available_balance + NEW.amount,
        total_earnings = total_earnings + NEW.amount
      WHERE id = NEW.partner_id;
    ELSIF OLD.status = 'approved' AND NEW.status = 'paid' THEN
      UPDATE partners 
      SET 
        available_balance = available_balance - NEW.amount,
        total_withdrawals = total_withdrawals + NEW.amount
      WHERE id = NEW.partner_id;
    ELSIF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
      UPDATE partners 
      SET 
        available_balance = available_balance + NEW.amount
      WHERE id = NEW.partner_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for partner commissions
CREATE TRIGGER update_partner_totals_on_commission
AFTER INSERT OR UPDATE ON partner_commissions
FOR EACH ROW EXECUTE FUNCTION update_partner_totals();

-- Function to log partner activity
CREATE OR REPLACE FUNCTION log_partner_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO partner_activity_logs (partner_id, activity_type, activity_data)
  VALUES (
    NEW.partner_id,
    TG_TABLE_NAME,
    jsonb_build_object(
      'record_id', NEW.id,
      'changes', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for activity logging
CREATE TRIGGER log_partner_referral_activity
AFTER INSERT ON partner_referrals
FOR EACH ROW EXECUTE FUNCTION log_partner_activity();

CREATE TRIGGER log_partner_commission_activity
AFTER INSERT ON partner_commissions
FOR EACH ROW EXECUTE FUNCTION log_partner_activity();

CREATE TRIGGER log_partner_withdrawal_activity
AFTER INSERT ON partner_withdrawals
FOR EACH ROW EXECUTE FUNCTION log_partner_activity();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_applications_updated_at ON partner_applications;
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON partner_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_referrals_updated_at ON partner_referrals;
CREATE TRIGGER update_partner_referrals_updated_at
BEFORE UPDATE ON partner_referrals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_commissions_updated_at ON partner_commissions;
CREATE TRIGGER update_partner_commissions_updated_at
BEFORE UPDATE ON partner_commissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_withdrawals_updated_at ON partner_withdrawals;
CREATE TRIGGER update_partner_withdrawals_updated_at
BEFORE UPDATE ON partner_withdrawals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_marketing_downloads_updated_at ON partner_marketing_downloads;
CREATE TRIGGER update_partner_marketing_downloads_updated_at
BEFORE UPDATE ON partner_marketing_downloads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_bank_profiles_updated_at ON partner_bank_profiles;
CREATE TRIGGER update_partner_bank_profiles_updated_at
BEFORE UPDATE ON partner_bank_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_marketing_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_bank_profiles ENABLE ROW LEVEL SECURITY;

-- Partner Bank Profiles RLS
CREATE POLICY "Partners can view own bank profile"
ON partner_bank_profiles FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Partners can manage own bank profile"
ON partner_bank_profiles FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage bank profiles"
ON partner_bank_profiles FOR ALL
USING (auth.role() = 'service_role');

-- Partners RLS
CREATE POLICY "Service role can manage partners"
ON partners FOR ALL
USING (auth.role() = 'service_role');

-- Partner Applications RLS
CREATE POLICY "Service role can manage applications"
ON partner_applications FOR ALL
USING (auth.role() = 'service_role');

-- Partner Referrals RLS
CREATE POLICY "Service role can manage referrals"
ON partner_referrals FOR ALL
USING (auth.role() = 'service_role');

-- Partner Commissions RLS
CREATE POLICY "Service role can manage commissions"
ON partner_commissions FOR ALL
USING (auth.role() = 'service_role');

-- Partner Withdrawals RLS
CREATE POLICY "Service role can manage withdrawals"
ON partner_withdrawals FOR ALL
USING (auth.role() = 'service_role');

-- Partner Activity Logs RLS
CREATE POLICY "Service role can manage activity logs"
ON partner_activity_logs FOR ALL
USING (auth.role() = 'service_role');

-- Partner Marketing Downloads RLS
CREATE POLICY "Service role can manage downloads"
ON partner_marketing_downloads FOR ALL
USING (auth.role() = 'service_role');

-- Partner Notifications RLS
CREATE POLICY "Service role can manage notifications"
ON partner_notifications FOR ALL
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;