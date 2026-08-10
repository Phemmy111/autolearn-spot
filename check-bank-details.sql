-- Check if student partner has bank details
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.partner_type,
  pbp.*
FROM partners p
LEFT JOIN partner_bank_profiles pbp ON pbp.partner_id = p.id
WHERE p.clerk_user_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';
