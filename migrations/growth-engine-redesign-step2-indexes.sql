-- AutoLearn Spot Growth Engine Redesign - Step 2: Create Indexes
-- This step creates indexes on the new tables

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================

-- Partner Applications
CREATE INDEX IF NOT EXISTS idx_partner_app_v2_email ON public.partner_applications_v2(email);
CREATE INDEX IF NOT EXISTS idx_partner_app_v2_status ON public.partner_applications_v2(status);

-- Partners
CREATE INDEX IF NOT EXISTS idx_partners_v2_clerk_user ON public.partners_v2(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_partners_v2_community_id ON public.partners_v2(community_ambassador_id);
CREATE INDEX IF NOT EXISTS idx_partners_v2_influencer_id ON public.partners_v2(influencer_id);
CREATE INDEX IF NOT EXISTS idx_partners_v2_type ON public.partners_v2(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_v2_status ON public.partners_v2(status);

-- Community Ambassadors
CREATE INDEX IF NOT EXISTS idx_comm_amb_v2_email ON public.community_ambassadors_v2(email);
CREATE INDEX IF NOT EXISTS idx_comm_amb_v2_partner ON public.community_ambassadors_v2(partner_id);

-- Influencers
CREATE INDEX IF NOT EXISTS idx_inf_v2_email ON public.influencers_v2(email);
CREATE INDEX IF NOT EXISTS idx_inf_v2_partner ON public.influencers_v2(partner_id);
CREATE INDEX IF NOT EXISTS idx_inf_v2_platform ON public.influencers_v2(platform);

-- Partner Bank Profiles
CREATE INDEX IF NOT EXISTS idx_bank_profile_v2_partner ON public.partner_bank_profiles(partner_id);

-- Fraud Alerts
CREATE INDEX IF NOT EXISTS idx_fraud_v2_status ON public.fraud_alerts_v2(status);
CREATE INDEX IF NOT EXISTS idx_fraud_v2_user ON public.fraud_alerts_v2(user_id);

-- Partner Notifications
CREATE INDEX IF NOT EXISTS idx_notif_v2_partner ON public.partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_notif_v2_read ON public.partner_notifications(read);

-- Growth Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_v2_date ON public.growth_analytics(snapshot_date);

-- Email History
CREATE INDEX IF NOT EXISTS idx_email_v2_recipient ON public.partner_email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_v2_type ON public.partner_email_history(email_type);