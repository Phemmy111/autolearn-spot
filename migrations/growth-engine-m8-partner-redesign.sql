-- AutoLearn Spot Growth Engine Milestone 8 (Partner Redesign)

DROP TABLE IF EXISTS public.ambassador_applications CASCADE;
DROP TABLE IF EXISTS public.ambassadors CASCADE;

CREATE TABLE IF NOT EXISTS public.partner_applications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL, user_email TEXT NOT NULL, user_name TEXT NOT NULL, phone TEXT NOT NULL, organization TEXT, website_or_social TEXT, motivation TEXT NOT NULL, marketing_plan TEXT, referral_count INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), admin_notes TEXT, reviewed_by TEXT, reviewed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

CREATE TABLE IF NOT EXISTS public.partners (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, user_email TEXT NOT NULL, user_name TEXT NOT NULL, partner_type TEXT NOT NULL CHECK (partner_type IN ('student', 'community', 'influencer')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')), organization TEXT, referral_code_id UUID REFERENCES public.referral_codes(id), total_referrals INTEGER DEFAULT 0, total_commissions INTEGER DEFAULT 0, total_earned INTEGER DEFAULT 0, total_withdrawn INTEGER DEFAULT 0, status_change_reason TEXT, status_changed_by TEXT, status_changed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own partner applications" ON public.partner_applications FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can insert own partner applications" ON public.partner_applications FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Admins can manage all partner applications" ON public.partner_applications FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own partner profile" ON public.partners FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Admins can manage all partners" ON public.partners FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

CREATE INDEX IF NOT EXISTS idx_partner_apps_user ON public.partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partners_user ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
