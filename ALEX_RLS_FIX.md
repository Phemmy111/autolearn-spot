# ALEX RLS Fix Required

## Issue
The ALEX tables have Row Level Security (RLS) policies that prevent authenticated users from creating conversations. The error occurs because:

```
Error creating conversation: {
  code: '42501',
  message: 'new row violates row-level security policy for table "alex_conversations"'
}
```

## Root Cause
The RLS policies in `migrations/alex-core-schema.sql` were designed for Supabase Auth but this application uses Clerk authentication. The policies check for `auth.jwt() ->> 'sub'` which doesn't work with Clerk JWTs.

## Solution
Disable RLS for ALEX tables since authorization is handled at the API level by Clerk middleware.

## Required Action
Run the following SQL migration in your Supabase SQL Editor:

```sql
-- Fix ALEX RLS for Clerk authentication
-- Since the application uses Clerk (not Supabase Auth) and authorization
-- is handled by API routes (Clerk auth middleware), we disable RLS for ALEX tables
-- Authorization is handled at the API level, not database level

-- Disable RLS for ALEX tables (authorization handled by API routes with Clerk auth)
ALTER TABLE alex_provider_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_usage DISABLE ROW LEVEL SECURITY;
```

Or run the migration file:
```bash
migrations/alex-rls-clerk-fix.sql
```

## Why This Approach?
- **Clerk Auth**: This application uses Clerk for authentication, not Supabase Auth
- **API-Level Security**: Authorization is handled by API routes using Clerk middleware
- **Consistent Pattern**: Other admin tables in this project (ai_providers, admins, etc.) also have RLS disabled for the same reason
- **Simpler**: Avoids complex JWT mapping between Clerk and Supabase

## Alternative (Database-Level Security)
If you prefer database-level security, you would need to:
1. Create a function to extract Clerk user ID from the JWT
2. Update RLS policies to use Clerk user identification  
3. Ensure the Clerk JWT is properly passed to Supabase
4. This is more complex and not needed for the current architecture

## After Applying the Fix
Once you run this SQL migration, ALEX conversations should work properly. The API routes will still enforce security through Clerk authentication middleware.
