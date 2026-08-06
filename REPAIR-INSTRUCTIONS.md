# Partner Authentication Repair Instructions

## Problem
The partner `femiadeleke209@gmail.com` (ID: `5de52f70-1d52-4ebd-8bc9-5cfd5569adca`) has no authentication record in the `influencers` table.

## Solution
Use one of these methods to repair the authentication:

### Method 1: Online API Tester (Easiest)
1. Go to: https://reqbin.com/
2. Create a new POST request
3. URL: `https://autolearn-spot.vercel.app/api/admin/repair/partner-auth`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "partnerId": "5de52f70-1d52-4ebd-8bc9-5cfd5569adca"
}
```
6. Click "Send"
7. Copy the returned password

### Method 2: Use the Admin Dashboard
1. Log in to admin dashboard
2. Go to Partners section
3. Find the partner: `femiadeleke209@gmail.com`
4. Click "Resend Welcome Email"
5. This will create the auth record and send the password

### Method 3: Direct SQL (Advanced)
If you have access to Supabase SQL Editor, run:

```sql
-- 1. Generate a password hash (you'll need to do this in code)
-- For now, let's create a simple record and you can reset password later

-- 2. Create influencer record
INSERT INTO influencers (full_name, email, password, status)
VALUES (
  'David Femi',
  'femiadeleke209@gmail.com',
  'temp_password_hash_placeholder', -- You'll need to generate proper hash
  'active'
)
RETURNING id;

-- 3. Link to partner
UPDATE partners
SET influencer_id = (returned_id_from_step_2)
WHERE id = '5de52f70-1d52-4ebd-8bc9-5cfd5569adca';
```

## After Repair
1. Use the new password to login as "influencer" partner type
2. Or use "Resend Welcome Email" to send credentials via email
3. Test login at: https://autolearn-spot.vercel.app/partners/login

## Verification
Run the debug API to verify:
```
GET https://autolearn-spot.vercel.app/api/admin/debug/partner-auth/femiadeleke209%40gmail.com
```

Expected result:
- `influencer` record should exist
- `has_password: true`
- `influencer_id` should be populated