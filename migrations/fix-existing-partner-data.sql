-- Fix Existing Partner Data to Use Email as clerk_user_id
-- This ensures existing partners created with the old schema work correctly

-- 1. Update all existing student partners to use email as clerk_user_id
UPDATE partners
SET clerk_user_id = email
WHERE partner_type = 'student' 
AND clerk_user_id IS NULL 
AND email IS NOT NULL;

-- 2. Update referral_codes owner_id to match partner clerk_user_id
-- For student partners, owner_id should be the email (clerk_user_id)
UPDATE referral_codes rc
SET owner_id = p.clerk_user_id
FROM partners p
WHERE p.partner_type = 'student'
AND p.referral_code_id = rc.id
AND rc.owner_id != p.clerk_user_id;

-- 3. For community partners, update owner_id to use their ambassador ID if needed
UPDATE referral_codes rc
SET owner_id = p.community_ambassador_id::text
FROM partners p
WHERE p.partner_type = 'community'
AND p.referral_code_id = rc.id
AND rc.owner_id IS NULL;

-- 4. For influencer partners, update owner_id to use their influencer ID if needed
UPDATE referral_codes rc
SET owner_id = p.influencer_id::text
FROM partners p
WHERE p.partner_type = 'influencer'
AND p.referral_code_id = rc.id
AND rc.owner_id IS NULL;

-- 5. Set default owner_type for referral_codes where it's NULL
UPDATE referral_codes
SET owner_type = CASE 
  WHEN p.partner_type IS NOT NULL THEN p.partner_type
  ELSE 'student'
END
FROM partners p
WHERE referral_codes.id = p.referral_code_id
AND referral_codes.owner_type IS NULL;

-- 6. Update partner stats to match referral_codes data
UPDATE partners p
SET total_clicks = COALESCE(rc.total_clicks, 0),
    total_registrations = COALESCE(rc.total_registrations, 0)
FROM referral_codes rc
WHERE p.referral_code_id = rc.id;

COMMIT;
