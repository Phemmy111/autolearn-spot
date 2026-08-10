-- Check commissions for student partner
SELECT 
  c.id,
  c.referrer_id,
  c.referrer_type,
  c.referee_email,
  c.amount,
  c.status,
  c.created_at
FROM commissions c
WHERE c.referrer_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI'
ORDER BY c.created_at DESC;
