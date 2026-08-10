-- Fix referral_codes owner_id to use partner.id (UUID) instead of email
-- This aligns with the new architecture where referral_codes.owner_id = partners.id

-- Update referral_codes to use partner.id instead of email
UPDATE referral_codes rc
SET owner_id = p.id::text
FROM partners p
WHERE p.referral_code_id = rc.id
AND rc.owner_id != p.id::text;

-- For any orphaned referral_codes without partners, try to match by email
UPDATE referral_codes rc
SET owner_id = p.id::text
FROM partners p
WHERE rc.owner_id = p.email
AND p.referral_code_id IS NULL
AND rc.owner_id != p.id::text;

-- Fix commissions to use partner.clerk_user_id (email) as referrer_id
-- Since commissions table uses text referrer_id, it should match partner.clerk_user_id
UPDATE commissions c
SET referrer_id = p.clerk_user_id
FROM partners p
WHERE c.referrer_id = p.id::text
AND c.referrer_id != p.clerk_user_id;

COMMIT;
