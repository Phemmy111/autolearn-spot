-- Fix community and influencer partners to have proper referral codes and stats

-- First, check if community/influencer partners have referral codes
SELECT 
  p.id,
  p.partner_type,
  p.community_ambassador_id,
  p.influencer_id,
  p.referral_code_id,
  rc.id as referral_code_id,
  rc.code,
  rc.owner_id,
  rc.total_clicks,
  rc.total_registrations
FROM partners p
LEFT JOIN referral_codes rc ON rc.id = p.referral_code_id
WHERE p.partner_type IN ('community', 'influencer');

-- Create referral codes for partners that don't have them
-- For community partners
INSERT INTO referral_codes (owner_id, code, status, owner_type, total_clicks, total_registrations)
SELECT 
  p.id::text,
  substring(md5(random()::text) from 1 for 8),
  'Active',
  'community',
  0,
  0
FROM partners p
WHERE p.partner_type = 'community'
AND p.referral_code_id IS NULL
ON CONFLICT (code) DO NOTHING;

-- For influencer partners
INSERT INTO referral_codes (owner_id, code, status, owner_type, total_clicks, total_registrations)
SELECT 
  p.id::text,
  substring(md5(random()::text) from 1 for 8),
  'Active',
  'influencer',
  0,
  0
FROM partners p
WHERE p.partner_type = 'influencer'
AND p.referral_code_id IS NULL
ON CONFLICT (code) DO NOTHING;

-- Link referral codes to partners
UPDATE partners p
SET referral_code_id = rc.id
FROM referral_codes rc
WHERE rc.owner_id = p.id::text
AND p.referral_code_id IS NULL;

-- Fix commissions to use partner.id for community/influencer partners
-- Since they don't have clerk_user_id, use their partner.id as referrer_id
UPDATE commissions c
SET referrer_id = p.id::text
FROM partners p
WHERE p.partner_type IN ('community', 'influencer')
AND c.referrer_id IS NULL
AND p.id::text = (SELECT owner_id FROM referral_codes WHERE id = p.referral_code_id);

COMMIT;
