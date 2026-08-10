-- Diagnose why commissions weren't created
-- Check the actual data in the tables

-- Check enrollments with referral codes
SELECT 
  e.id,
  e.email,
  e.referred_by_code,
  e.status,
  e.amount_paid,
  e.payment_ref,
  e.created_at
FROM enrollments e
WHERE e.referred_by_code IS NOT NULL
AND e.status = 'active'
AND e.amount_paid > 5000
ORDER BY e.created_at DESC;

-- Check referral_codes table
SELECT 
  rc.id,
  rc.code,
  rc.owner_id,
  rc.owner_type,
  rc.total_registrations
FROM referral_codes rc
WHERE rc.code IN (SELECT referred_by_code FROM enrollments WHERE referred_by_code IS NOT NULL);

-- Check partners table
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.partner_type,
  p.clerk_user_id,
  p.commission_rate
FROM partners p
WHERE p.id::text IN (SELECT owner_id FROM referral_codes WHERE code IN (SELECT referred_by_code FROM enrollments WHERE referred_by_code IS NOT NULL));

-- Check if commissions already exist
SELECT 
  c.id,
  c.referrer_id,
  c.referrer_type,
  c.referee_email,
  c.amount,
  c.status,
  c.payment_reference
FROM commissions c
WHERE c.payment_reference IN (SELECT payment_ref FROM enrollments WHERE referred_by_code IS NOT NULL);
