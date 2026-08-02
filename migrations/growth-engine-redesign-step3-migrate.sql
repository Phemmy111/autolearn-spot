-- AutoLearn Spot Growth Engine Redesign - Step 3: Data Migration
-- This step migrates data from old tables to new tables

-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Update referral_codes to support owner_type if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_codes' 
    AND column_name = 'owner_type'
  ) THEN
    ALTER TABLE public.referral_codes ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'student';
  END IF;
END $$;

-- Add CHECK constraint for owner_type
ALTER TABLE public.referral_codes DROP CONSTRAINT IF EXISTS referral_codes_owner_type_check;
ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_owner_type_check 
  CHECK (owner_type IN ('student', 'community', 'influencer'));

-- ============================================
-- MIGRATE DATA FROM OLD TO NEW TABLES
-- ============================================

-- Migrate from ambassador_applications to partner_applications_v2
INSERT INTO public.partner_applications_v2 (
  id, full_name, email, phone, whatsapp, state, occupation, 
  motivation, promotion_method, organization, 
  experience, status, reviewed_by, reviewed_at, admin_notes, 
  created_at, updated_at
)
SELECT 
  aa.id, aa.full_name, aa.email, aa.phone, 
  COALESCE(aa.whatsapp, aa.phone) as whatsapp, -- Use phone if whatsapp is null
  COALESCE(aa.state, 'N/A') as state, -- Use N/A if state is null
  COALESCE(aa.occupation, 'Other') as occupation, -- Use Other if occupation is null
  aa.reason, aa.promotion_method, aa.institution,
  aa.experience, aa.status, aa.reviewed_by, aa.reviewed_at, 
  'Migrated from old system' as admin_notes,
  aa.created_at, aa.updated_at
FROM public.ambassador_applications aa
ON CONFLICT (id) DO NOTHING;

-- Migrate student partners from referral_codes to partners_v2
-- Note: We can't easily get user details without a users table, so we'll use placeholder data
-- This will be updated when students log in or make purchases
INSERT INTO public.partners_v2 (
  id, partner_type, clerk_user_id, full_name, email, 
  commission_rate, status, referral_code_id, 
  total_clicks, total_registrations, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'student' as partner_type,
  rc.owner_id as clerk_user_id,
  'Student' as full_name,
  'student@example.com' as email, -- Placeholder, will be updated on first login
  1500 as commission_rate,
  'active' as status,
  rc.id as referral_code_id,
  rc.total_clicks,
  rc.total_registrations,
  rc.created_at,
  rc.updated_at
FROM public.referral_codes rc
WHERE rc.owner_type = 'student' OR rc.owner_type IS NULL
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Migrate community ambassadors to community_ambassadors_v2
-- Note: organization and last_login_at columns may not exist in old table
INSERT INTO public.community_ambassadors_v2 (
  id, email, password_hash, full_name, phone, whatsapp, 
  state, occupation, status, 
  created_at, updated_at
)
SELECT 
  ca.id, ca.email, ca.password_hash, ca.full_name, ca.phone, ca.whatsapp,
  ca.state, ca.occupation, 
  ca.status,
  ca.created_at, ca.updated_at
FROM public.community_ambassadors ca
ON CONFLICT (id) DO NOTHING;

-- Create partner records for migrated community ambassadors
INSERT INTO public.partners_v2 (
  id, partner_type, community_ambassador_id, full_name, email, 
  phone, commission_rate, status, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'community' as partner_type,
  ca.id as community_ambassador_id,
  ca.full_name,
  ca.email,
  ca.phone,
  1500 as commission_rate,
  ca.status,
  ca.created_at,
  ca.updated_at
FROM public.community_ambassadors_v2 ca
WHERE ca.partner_id IS NULL
ON CONFLICT (community_ambassador_id) DO NOTHING;

-- Update community_ambassadors_v2 with partner_id
UPDATE public.community_ambassadors_v2
SET partner_id = p.id
FROM public.partners_v2 p
WHERE p.community_ambassador_id = public.community_ambassadors_v2.id
AND public.community_ambassadors_v2.partner_id IS NULL;

-- Migrate influencers to influencers_v2
-- Note: last_login_at and created_by columns may not exist in old table
INSERT INTO public.influencers_v2 (
  id, email, password_hash, full_name, phone, 
  platform, followers, category, commission_rate, 
  status, created_at, updated_at
)
SELECT 
  inf.id, inf.email, inf.password_hash, inf.full_name, inf.phone,
  inf.platform, inf.followers, inf.category, inf.commission_rate,
  inf.status, inf.created_at, inf.updated_at
FROM public.influencers inf
ON CONFLICT (id) DO NOTHING;

-- Create partner records for migrated influencers
INSERT INTO public.partners_v2 (
  id, partner_type, influencer_id, full_name, email, 
  phone, commission_rate, custom_commission_rate, status, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'influencer' as partner_type,
  inf.id as influencer_id,
  inf.full_name,
  inf.email,
  inf.phone,
  inf.commission_rate,
  inf.commission_rate as custom_commission_rate,
  inf.status,
  inf.created_at,
  inf.updated_at
FROM public.influencers_v2 inf
WHERE inf.partner_id IS NULL
ON CONFLICT (influencer_id) DO NOTHING;

-- Update influencers_v2 with partner_id
UPDATE public.influencers_v2
SET partner_id = p.id
FROM public.partners_v2 p
WHERE p.influencer_id = public.influencers_v2.id
AND public.influencers_v2.partner_id IS NULL;

-- Update partners_v2 with referral_code_id for existing referral codes
UPDATE public.partners_v2 p
SET referral_code_id = rc.id
FROM public.referral_codes rc
WHERE (p.clerk_user_id = rc.owner_id AND rc.owner_type = 'student')
   OR (p.community_ambassador_id::text = rc.owner_id AND rc.owner_type = 'community')
   OR (p.influencer_id::text = rc.owner_id AND rc.owner_type = 'influencer')
AND p.referral_code_id IS NULL;