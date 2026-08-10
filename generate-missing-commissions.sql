-- Generate missing commissions for historical enrollments with referral codes
-- This fixes the issue where partners referred students but didn't get commissions

-- First, check which enrollments need commissions
SELECT 
  e.id as enrollment_id,
  e.email,
  e.referred_by_code,
  e.status,
  e.amount_paid,
  e.payment_ref,
  e.created_at,
  rc.code,
  rc.owner_id,
  rc.owner_type,
  p.id as partner_id,
  p.partner_type,
  p.clerk_user_id,
  p.commission_rate,
  c.id as existing_commission_id
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.code = e.referred_by_code
LEFT JOIN partners p ON p.id::text = rc.owner_id
LEFT JOIN commissions c ON c.payment_reference = e.payment_ref
WHERE e.referred_by_code IS NOT NULL
AND e.status = 'active'
AND e.amount_paid > 5000  -- Only for paid enrollments (not scholarship ₦5,000)
AND c.id IS NULL  -- No commission exists yet
ORDER BY e.created_at DESC;

-- Generate commissions for these enrollments
INSERT INTO commissions (
  referrer_id,
  referrer_type,
  referee_email,
  referral_code,
  payment_reference,
  amount,
  status,
  holding_period_ends_at,
  created_at,
  updated_at
)
SELECT 
  CASE 
    WHEN p.partner_type = 'student' AND p.clerk_user_id IS NOT NULL THEN p.clerk_user_id
    ELSE p.id::text
  END as referrer_id,
  p.partner_type as referrer_type,
  e.email as referee_email,
  e.referred_by_code as referral_code,
  e.payment_ref as payment_reference,
  p.commission_rate as amount,
  'available' as status,  -- Make them available immediately since payments are historical
  NOW() as holding_period_ends_at,  -- No holding period for historical payments
  e.created_at as created_at,
  NOW() as updated_at
FROM enrollments e
LEFT JOIN referral_codes rc ON rc.code = e.referred_by_code
LEFT JOIN partners p ON p.id::text = rc.owner_id
LEFT JOIN commissions c ON c.payment_reference = e.payment_ref
WHERE e.referred_by_code IS NOT NULL
AND e.status = 'active'
AND e.amount_paid > 5000  -- Only for paid enrollments (not scholarship ₦5,000)
AND c.id IS NULL  -- No commission exists yet
AND p.id IS NOT NULL  -- Partner exists
ON CONFLICT (payment_reference) DO NOTHING;

-- Update referral_codes total_registrations
UPDATE referral_codes rc
SET total_registrations = (
  SELECT COUNT(*)
  FROM enrollments e
  WHERE e.referred_by_code = rc.code
  AND e.status = 'active'
)
WHERE rc.id IN (
  SELECT rc.id
  FROM referral_codes rc
  JOIN enrollments e ON e.referred_by_code = rc.code
  WHERE e.status = 'active'
);

COMMIT;
