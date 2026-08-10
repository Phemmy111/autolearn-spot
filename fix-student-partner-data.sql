-- Fix student partner data with real names and emails from user table
-- This updates placeholder data (student@example.com) with actual user data

-- First, check the current state
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.clerk_user_id,
  u.first_name,
  u.last_name,
  u.email as user_email,
  u.clerk_id
FROM partners p
LEFT JOIN "user" u ON u.clerk_id = p.clerk_user_id
WHERE p.partner_type = 'student'
AND p.email = 'student@example.com';

-- Update student partners with real data from user table
UPDATE partners p
SET 
  full_name = COALESCE(u.first_name || ' ' || u.last_name, u.email),
  email = COALESCE(u.email, p.email)
FROM "user" u
WHERE u.clerk_id = p.clerk_user_id
AND p.partner_type = 'student'
AND p.email = 'student@example.com';

-- Verify the update
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.clerk_user_id,
  u.first_name,
  u.last_name,
  u.email as user_email
FROM partners p
LEFT JOIN "user" u ON u.clerk_id = p.clerk_user_id
WHERE p.partner_type = 'student'
ORDER BY p.created_at DESC;
