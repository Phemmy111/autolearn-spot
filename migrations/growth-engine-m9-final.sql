-- AutoLearn Spot Growth Engine Milestone 9 Schema
-- Final implementation for Student, Community, and Influencer Partners

-- 1. Create Community Ambassadors
CREATE TABLE IF NOT EXISTS public.community_ambassadors (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, phone TEXT, whatsapp TEXT, state TEXT, occupation TEXT, promotion_method TEXT, password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 2. Create Ambassador Applications
CREATE TABLE IF NOT EXISTS public.ambassador_applications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id TEXT, is_student BOOLEAN NOT NULL DEFAULT false, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, whatsapp TEXT, state TEXT, institution TEXT, occupation TEXT, promotion_method TEXT, social_links TEXT, experience TEXT, reason TEXT, status TEXT NOT NULL DEFAULT 'pending', reviewed_by TEXT, reviewed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 3. Create Influencers
CREATE TABLE IF NOT EXISTS public.influencers (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, phone TEXT, platform TEXT, followers TEXT, category TEXT, commission_rate INTEGER NOT NULL DEFAULT 2000, password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL);

-- 4. Update referral_codes to support owner_type
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'student';
-- Valid values for owner_type: 'student', 'community', 'influencer'

-- 5. Create Fraud Alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'medium', description TEXT NOT NULL, user_id TEXT, related_entity_id TEXT, metadata JSONB, status TEXT NOT NULL DEFAULT 'open', created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, resolved_at TIMESTAMP WITH TIME ZONE, resolved_by TEXT, resolution_notes TEXT);

-- 6. Ensure RLS
ALTER TABLE public.community_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything
CREATE POLICY "Admins can manage community_ambassadors" ON public.community_ambassadors USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
CREATE POLICY "Admins can manage ambassador_applications" ON public.ambassador_applications USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
CREATE POLICY "Admins can manage influencers" ON public.influencers USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
CREATE POLICY "Admins can manage fraud_alerts" ON public.fraud_alerts USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Note: Because community ambassadors and influencers don't use Clerk (they have their own auth portal), 
-- we will use the Service Role Key in API routes for their dashboard data, or we could set up custom JWTs.
-- For simplicity, their Next.js API routes will validate their session (via secure HTTP-only cookies) 
-- and then use the Supabase Service Role key to fetch data.

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_comm_amb_email ON public.community_ambassadors(email);
CREATE INDEX IF NOT EXISTS idx_amb_app_email ON public.ambassador_applications(email);
CREATE INDEX IF NOT EXISTS idx_amb_app_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_inf_email ON public.influencers(email);
CREATE INDEX IF NOT EXISTS idx_fraud_status ON public.fraud_alerts(status);
