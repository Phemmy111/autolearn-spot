-- Fix partner authentication records for existing partners
-- This script creates missing auth records in community_ambassadors and influencers tables

-- Step 1: Generate new passwords for partners without auth records
-- This will help us identify which partners need fixing

-- Check partners without community_ambassador_id
SELECT id, email, full_name, partner_type, community_ambassador_id, influencer_id
FROM partners
WHERE (community_ambassador_id IS NULL OR influencer_id IS NULL)
AND partner_type IN ('community', 'influencer');

-- Step 2: For partners without auth records, we need to:
-- 1. Generate a temporary password
-- 2. Create auth record in appropriate table
-- 3. Link partner to auth record

-- For community partners without community_ambassador_id:
-- You'll need to run this manually with specific values since we can't generate passwords in SQL

-- Example for a specific community partner:
-- INSERT INTO community_ambassadors (full_name, email, password, status)
-- VALUES ('Partner Name', 'partner@email.com', 'TEMP_PASSWORD_HASH', 'active')
-- RETURNING id;

-- Then update the partner:
-- UPDATE partners 
-- SET community_ambassador_id = (returned_id)
-- WHERE email = 'partner@email.com';

-- Step 3: Use the API endpoint instead for easier repair
-- POST /api/admin/repair/partner-auth
-- This will automatically handle password generation and record creation