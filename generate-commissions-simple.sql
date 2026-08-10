-- Simple commission generation for the 2 known enrollments
-- Uses the actual data we know exists

-- Insert commissions for the 2 enrollments
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
VALUES 
  -- First enrollment: marvellousomobomi@gmail.com
  (
    'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI',  -- clerk_user_id from partner
    'student',
    'marvellousomobomi@gmail.com',
    '1CE92988',
    '6qd0j2yv35',
    1500,
    'available',
    NOW(),
    '2026-08-10 11:50:22.89565+00',
    NOW()
  ),
  -- Second enrollment: pelumismsn@gmail.com
  (
    'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI',  -- clerk_user_id from partner
    'student',
    'pelumismsn@gmail.com',
    '1CE92988',
    'dlu6vp9cfq',
    1500,
    'available',
    NOW(),
    '2026-08-10 11:38:02.624259+00',
    NOW()
  )
ON CONFLICT (payment_reference) DO NOTHING;

-- Update referral_codes total_registrations
UPDATE referral_codes
SET total_registrations = 2
WHERE code = '1CE92988';

-- Update partner stats
UPDATE partners
SET 
  total_registrations = 2,
  available_earnings = 3000,
  lifetime_earnings = 3000
WHERE clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';

-- Verify
SELECT * FROM commissions WHERE payment_reference IN ('6qd0j2yv35', 'dlu6vp9cfq');
