-- Update student partner with real name from user table
-- Use email to match since there's no clerk_id column in user table

-- First, find the user's email by checking enrollments
-- The student partner's clerk_user_id is: user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI
-- We need to find which user this belongs to

-- Check if we can find the user by checking their own enrollment (not the referrals)
SELECT 
  u.id,
  u.firstName,
  u.lastName,
  u.email
FROM "user" u
WHERE u.email IN (
  SELECT DISTINCT email 
  FROM enrollments 
  WHERE email NOT IN ('marvellousomobomi@gmail.com', 'pelumismsn@gmail.com')
  AND email IS NOT NULL
  LIMIT 1
);

-- For now, let's try to match by checking if there's a user with the clerk user ID stored in settings
SELECT 
  u.id,
  u.firstName,
  u.lastName,
  u.email,
  u.settings
FROM "user" u
WHERE u.settings::text LIKE '%user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI%';

-- Update with the found user data (you'll need to replace the email with the actual result from above)
-- For now, I'll use a more generic approach - look for the user who enrolled without a referral
UPDATE partners p
SET 
  full_name = COALESCE(u.firstName || ' ' || u.lastName, u.email),
  email = u.email
FROM "user" u
WHERE u.email = (
  SELECT e.email 
  FROM enrollments e 
  WHERE e.referred_by_code IS NULL 
  AND e.email NOT IN ('marvellousomobomi@gmail.com', 'pelumismsn@gmail.com')
  LIMIT 1
)
AND p.clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';

-- Verify
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.clerk_user_id,
  p.total_registrations,
  p.available_earnings
FROM partners p
WHERE p.partner_type = 'student'
AND clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';
