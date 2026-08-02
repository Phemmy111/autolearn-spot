-- AutoLearn Spot Growth Engine Redesign - Step 4: Swap Tables and Cleanup
-- This step swaps the new tables with the old ones and drops the old tables

-- ============================================
-- BACKUP OLD TABLES (RENAMING)
-- ============================================

-- Rename old tables to _backup
ALTER TABLE IF EXISTS public.partner_applications RENAME TO partner_applications_backup;
ALTER TABLE IF EXISTS public.partners RENAME TO partners_backup;
ALTER TABLE IF EXISTS public.community_ambassadors RENAME TO community_ambassadors_backup;
ALTER TABLE IF EXISTS public.influencers RENAME TO influencers_backup;
ALTER TABLE IF EXISTS public.fraud_alerts RENAME TO fraud_alerts_backup;

-- ============================================
-- SWAP NEW TABLES TO PRODUCTION NAMES
-- ============================================

-- Rename v2 tables to production names
ALTER TABLE public.partner_applications_v2 RENAME TO partner_applications;
ALTER TABLE public.partners_v2 RENAME TO partners;
ALTER TABLE public.community_ambassadors_v2 RENAME TO community_ambassadors;
ALTER TABLE public.influencers_v2 RENAME TO influencers;
ALTER TABLE public.fraud_alerts_v2 RENAME TO fraud_alerts;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Partner Applications
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
CREATE POLICY "Admins can manage partner applications" ON public.partner_applications
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;
CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP POLICY IF EXISTS "Students can read own partner profile" ON public.partners;
CREATE POLICY "Students can read own partner profile" ON public.partners
  FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Community Ambassadors
ALTER TABLE public.community_ambassadors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage community ambassadors" ON public.community_ambassadors;
CREATE POLICY "Admins can manage community ambassadors" ON public.community_ambassadors
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Influencers
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage influencers" ON public.influencers;
CREATE POLICY "Admins can manage influencers" ON public.influencers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partner Bank Profiles
ALTER TABLE public.partner_bank_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage bank profiles" ON public.partner_bank_profiles;
CREATE POLICY "Admins can manage bank profiles" ON public.partner_bank_profiles
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Fraud Alerts
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage fraud alerts" ON public.fraud_alerts;
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Partner Notifications
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Partners can read own notifications" ON public.partner_notifications;
CREATE POLICY "Partners can read own notifications" ON public.partner_notifications
  FOR SELECT USING (partner_id IN (
    SELECT id FROM public.partners WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.partner_notifications;
CREATE POLICY "Admins can manage notifications" ON public.partner_notifications
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Growth Analytics
ALTER TABLE public.growth_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read analytics" ON public.growth_analytics;
CREATE POLICY "Admins can read analytics" ON public.growth_analytics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Email History
ALTER TABLE public.partner_email_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read email history" ON public.partner_email_history;
CREATE POLICY "Admins can read email history" ON public.partner_email_history
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- ============================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APPLY UPDATED_AT TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_partner_applications_updated_at ON public.partner_applications;
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
DROP TRIGGER IF EXISTS update_community_ambassadors_updated_at ON public.community_ambassadors;
DROP TRIGGER IF EXISTS update_influencers_updated_at ON public.influencers;
DROP TRIGGER IF EXISTS update_partner_bank_profiles_updated_at ON public.partner_bank_profiles;
DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
DROP TRIGGER IF EXISTS update_commissions_updated_at ON public.commissions;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;

-- Create new triggers
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
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key constraints after data migration
ALTER TABLE public.partners 
  ADD CONSTRAINT partners_referral_code_id_fkey 
  FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id) ON DELETE SET NULL;

ALTER TABLE public.community_ambassadors 
  ADD CONSTRAINT community_ambassadors_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.influencers 
  ADD CONSTRAINT influencers_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.partner_bank_profiles 
  ADD CONSTRAINT partner_bank_profiles_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.partner_notifications 
  ADD CONSTRAINT partner_notifications_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.partner_applications IS 'Applications for Community Partner program';
COMMENT ON TABLE public.partners IS 'Unified partner table for all partner types';
COMMENT ON TABLE public.community_ambassadors IS 'Community partners with separate authentication';
COMMENT ON TABLE public.influencers IS 'Influencer partners with separate authentication, admin-created';
COMMENT ON TABLE public.partner_bank_profiles IS 'Bank details for partners (one per partner)';
COMMENT ON TABLE public.fraud_alerts IS 'Fraud detection alerts for admin review';
COMMENT ON TABLE public.partner_notifications IS 'In-app notifications for partners';
COMMENT ON TABLE public.growth_analytics IS 'Daily analytics snapshots for growth metrics';
COMMENT ON TABLE public.partner_email_history IS 'History of emails sent to partners';

COMMENT ON COLUMN public.partners.commission_rate IS 'Default commission rate (1500 for student/community, 2500 for influencer)';
COMMENT ON COLUMN public.partners.custom_commission_rate IS 'Custom commission rate for specific partners (e.g., special influencer deals)';
COMMENT ON COLUMN public.commissions.holding_period_ends_at IS '7-day holding period after which commission becomes available';
COMMENT ON COLUMN public.fraud_alerts.severity IS 'Severity level: low, medium, or high';

-- ============================================
-- CLEANUP (OPTIONAL - Run after verification)
-- ============================================

-- Uncomment these lines after verifying everything works correctly
-- DROP TABLE IF EXISTS public.partner_applications_backup CASCADE;
-- DROP TABLE IF EXISTS public.partners_backup CASCADE;
-- DROP TABLE IF EXISTS public.community_ambassadors_backup CASCADE;
-- DROP TABLE IF EXISTS public.influencers_backup CASCADE;
-- DROP TABLE IF EXISTS public.fraud_alerts_backup CASCADE;