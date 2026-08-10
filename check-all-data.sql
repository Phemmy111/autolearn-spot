-- Check all data for student partner
-- 1. Bank details
SELECT * FROM partner_bank_profiles pbp
WHERE pbp.partner_id = '6e246405-b232-4062-8ca4-93362ce85256';

-- 2. Commissions
SELECT * FROM commissions c
WHERE c.referrer_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';

-- 3. Marketing resources
SELECT * FROM partner_marketing_downloads
LIMIT 5;

-- 4. Referrals (from commissions table)
SELECT c.referee_email, c.amount, c.status, c.created_at
FROM commissions c
WHERE c.referrer_id = 'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI';
