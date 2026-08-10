-- Find the student's actual email (the partner, not the referrals)
-- The student partner referred 2 people, so we need to find their own enrollment
-- Look for enrollments without a referral code

SELECT 
  e.id,
  e.email,
  e.first_name,
  e.last_name,
  e.referred_by_code
FROM enrollments e
WHERE e.referred_by_code IS NULL
AND e.email NOT IN ('marvellousomobomi@gmail.com', 'pelumismsn@gmail.com')
ORDER BY e.created_at
LIMIT 5;
