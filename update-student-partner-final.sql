-- Update student partner with real data from enrollment
-- The student partner is femiadeleke2020@gmail.com (Femi Adeleke)

UPDATE partners
SET 
  full_name = 'Femi Adeleke',
  email = 'femiadeleke2020@gmail.com'
WHERE partner_type = 'student'
AND clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';

-- Verify the update
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
