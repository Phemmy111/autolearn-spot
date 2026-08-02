-- AutoLearn Spot Growth Engine Milestone 5+ Schema

-- 1. ambassador_applications
CREATE TABLE IF NOT EXISTS public.ambassador_applications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL, user_email TEXT NOT NULL, user_name TEXT NOT NULL, phone TEXT NOT NULL, institution TEXT NOT NULL, campus_location TEXT NOT NULL, student_id TEXT, level_of_study TEXT, course_of_study TEXT, graduation_year INTEGER, motivation TEXT NOT NULL, marketing_plan TEXT, social_media_links JSONB, referral_count INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), admin_notes TEXT, reviewed_by TEXT, reviewed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 2. ambassadors
CREATE TABLE IF NOT EXISTS public.ambassadors (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, user_email TEXT NOT NULL, user_name TEXT NOT NULL, ambassador_type TEXT NOT NULL CHECK (ambassador_type IN ('campus_ambassador', 'partner_ambassador')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')), institution TEXT, campus_location TEXT, referral_code_id UUID REFERENCES public.referral_codes(id), total_referrals INTEGER DEFAULT 0, total_commissions INTEGER DEFAULT 0, total_earned INTEGER DEFAULT 0, total_withdrawn INTEGER DEFAULT 0, promotion_eligible BOOLEAN DEFAULT false, promotion_eligible_at TIMESTAMP WITH TIME ZONE, status_change_reason TEXT, status_changed_by TEXT, status_changed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 3. fraud_alerts
CREATE TABLE IF NOT EXISTS public.fraud_alerts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, alert_type TEXT NOT NULL CHECK (alert_type IN ('self_referral', 'duplicate_commission', 'suspicious_pattern', 'rate_limit_exceeded', 'payment_anomaly')), severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')), user_id TEXT, referral_code TEXT, payment_reference TEXT, ip_address INET, description TEXT NOT NULL, metadata JSONB, status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')), resolved_by TEXT, resolved_at TIMESTAMP WITH TIME ZONE, resolution_notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 4. growth_analytics
CREATE TABLE IF NOT EXISTS public.growth_analytics (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, snapshot_date DATE NOT NULL UNIQUE, total_referrals INTEGER DEFAULT 0, total_commissions INTEGER DEFAULT 0, total_commission_amount INTEGER DEFAULT 0, total_withdrawals INTEGER DEFAULT 0, total_withdrawal_amount INTEGER DEFAULT 0, active_referrers INTEGER DEFAULT 0, active_ambassadors INTEGER DEFAULT 0, conversion_rate DECIMAL(5,2), fraud_attempts INTEGER DEFAULT 0, metadata JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- RLS for ambassador_applications
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own applications" ON public.ambassador_applications FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can insert own applications" ON public.ambassador_applications FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Admins can manage all applications" ON public.ambassador_applications FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- RLS for ambassadors
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own ambassador profile" ON public.ambassadors FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Admins can manage all ambassadors" ON public.ambassadors FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- RLS for fraud_alerts and growth_analytics
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

ALTER TABLE public.growth_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view growth analytics" ON public.growth_analytics FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_user ON public.ambassador_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_apps_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambassadors_user ON public.ambassadors(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_type ON public.ambassadors(ambassador_type);
CREATE INDEX IF NOT EXISTS idx_ambassadors_status ON public.ambassadors(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_type ON public.fraud_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_growth_analytics_date ON public.growth_analytics(snapshot_date DESC);
