# Admin Guide

## Admin System Overview

The admin system has been migrated from environment variable-based authentication to a database-driven system. Admins are now managed through the Supabase database with role-based access control.

### Admin Roles

- **Super Admin**: Full access to all admin features, including managing other admins
- **Admin**: Can manage quizzes, questions, and view results, but cannot manage other admins

### Initial Super Admin

The system is seeded with one initial super admin:
- **Email**: femiadeleke2020@gmail.com
- **Role**: super_admin
- **Status**: Active

## Adding Additional Admins

To add additional admins to the system, you must be a Super Admin.

### 1. Access Admin Users Page

Navigate to `/admin/admins` from the admin dashboard. This page is only accessible to Super Admins.

### 2. Add New Admin

Click the "Add Admin" button and provide:
- **Email**: The email address of the new admin (must match their Clerk account)
- **Role**: Choose between "Admin" or "Super Admin"

### 3. New Admin Access

The new admin can now:
- Sign in with their existing Clerk account
- Access `/admin` to manage quizzes
- Create, edit, and delete quizzes
- Manage quiz questions
- View student results and leaderboard

**Super Admins additionally can:**
- Add, remove, activate, or deactivate other admins
- Change admin roles
- View all admin users

### 4. Managing Admins

From the Admin Users page, Super Admins can:
- **Activate/Deactivate**: Toggle admin status without deleting the record
- **Delete**: Permanently remove an admin (cannot delete the last super admin)
- **View Role**: See whether each admin is a Super Admin or regular Admin

## Security Architecture

### Multi-Layer Security

The admin system implements defense-in-depth security:

#### 1. **Server-Side Authentication**
- All admin routes use `requireAdmin()` middleware
- Checks Clerk authentication before allowing access
- Validates email against the `admins` table in Supabase
- Checks that the admin is active (`is_active = true`)
- Returns 403 Forbidden for unauthorized access

#### 2. **Role-Based Access Control**
- `requireAdmin()`: Grants access to both Admins and Super Admins
- `requireSuperAdmin()`: Grants access only to Super Admins
- Admin management routes use `requireSuperAdmin()` for protection
- Prevents regular admins from managing other admins

#### 3. **API Route Protection**
- All write operations (POST, PUT, DELETE) are protected at the API level
- Public endpoints only allow read operations (GET)
- Admin-only endpoints require server-side admin verification
- Students cannot bypass UI checks by calling APIs directly

#### 4. **Supabase Row Level Security (RLS)**
- All tables have RLS enabled
- Write operations (INSERT, UPDATE, DELETE) are blocked by default
- Only specific operations are allowed through RLS policies
- Even if API protection fails, database blocks unauthorized writes

#### 5. **Quiz Access Control**
- Students can only view active quizzes (`is_active = true`)
- Questions are only visible for active quizzes
- Inactive quizzes are hidden from students
- Admins can view and manage all quizzes

### Security Features

| Feature | Implementation |
|---------|---------------|
| Admin Authentication | Clerk + Database admins table |
| Role-Based Access | Super Admin vs Admin roles |
| API Protection | Server-side admin checks |
| Database Security | Supabase RLS policies |
| Quiz Visibility | Active/inactive status |
| Response Privacy | Users can only see their own responses |
| Leaderboard | Public read, system write only |
| Admin Management | Super Admin only, protected by RLS |

### API Route Security Summary

#### Public Routes (Student Access)
- `GET /api/quizzes` - View active quizzes
- `GET /api/quizzes/[id]` - View quiz details (if active)
- `POST /api/quizzes/[id]/submit` - Submit quiz answers (requires auth)
- `GET /api/leaderboard` - View leaderboard

#### Admin-Only Routes
- `POST /api/quizzes` - Create quiz
- `PUT /api/quizzes/[id]` - Update quiz
- `DELETE /api/quizzes/[id]` - Delete quiz
- `GET /api/admin/quizzes/[id]/questions` - View all questions
- `POST /api/admin/quizzes/[id]/questions` - Create question
- `PUT /api/admin/quizzes/[id]/questions/[questionId]` - Update question
- `DELETE /api/admin/quizzes/[id]/questions/[questionId]` - Delete question

#### Super Admin-Only Routes
- `GET /api/admin/admins` - View all admins
- `POST /api/admin/admins` - Create new admin
- `PUT /api/admin/admins/[id]` - Update admin (role, status)
- `DELETE /api/admin/admins/[id]` - Delete admin

### Database RLS Policies

#### Quizzes Table
- **SELECT**: Only active quizzes
- **INSERT**: Blocked (API only)
- **UPDATE**: Blocked (API only)
- **DELETE**: Blocked (API only)

#### Questions Table
- **SELECT**: Only for active quizzes
- **INSERT**: Blocked (API only)
- **UPDATE**: Blocked (API only)
- **DELETE**: Blocked (API only)

#### Quiz Responses Table
- **SELECT**: Own responses only
- **INSERT**: Own responses only
- **UPDATE**: Blocked
- **DELETE**: Blocked

#### Leaderboard Table
- **SELECT**: Public
- **INSERT**: Blocked (trigger only)
- **UPDATE**: Blocked (trigger only)
- **DELETE**: Blocked

#### Admins Table
- **SELECT**: Blocked (API only, service role)
- **INSERT**: Blocked (API only, service role)
- **UPDATE**: Blocked (API only, service role)
- **DELETE**: Blocked (API only, service role)

## Best Practices

1. **Principle of Least Privilege**
   - Only grant Super Admin role when necessary
   - Use regular Admin role for most administrative tasks
   - Deactivate admins instead of deleting when possible
   - Regularly review admin access and remove unnecessary permissions

2. **Regular Security Audits**
   - Review admin access periodically via Admin Users page
   - Remove admins who no longer need access
   - Monitor quiz creation and modification logs
   - Check for inactive or suspicious admin accounts

3. **Quiz Management**
   - Keep quizzes inactive until ready
   - Review questions before publishing
   - Use quiz descriptions to clarify content

4. **Student Privacy**
   - Students can only see their own quiz responses
   - Leaderboard shows aggregated data only
   - Admins can view all results for analysis

## Troubleshooting

### Admin Access Denied

If you can't access the admin panel:

1. **Check Database Record**
   - Ensure your email exists in the `admins` table
   - Verify your admin status is active (`is_active = true`)
   - Check that your email matches your Clerk account exactly

2. **Check Clerk Authentication**
   - Ensure you're signed in with the correct email
   - Sign out and sign back in if needed
   - Verify your Clerk account is active

3. **Check Role Permissions**
   - Some features require Super Admin role
   - Regular admins cannot access `/admin/admins`
   - Contact a Super Admin if you need elevated permissions

### Cannot Add New Admin

If you cannot add new admins:

1. **Verify Super Admin Status**
   - Only Super Admins can manage other admins
   - Check your role in the Admin Users page
   - Contact the system owner if you need Super Admin access

2. **Check Email Format**
   - Ensure email is exactly as registered in Clerk
   - Email will be converted to lowercase automatically
   - Check for typos in the email address

### API Errors

If you get 403 Forbidden errors:

1. **Verify Admin Status**
   - Check your email exists in the admins table
   - Ensure you're authenticated with Clerk
   - Verify your admin is active

2. **Check API Route**
   - Some routes are Super Admin only
   - Public routes only allow GET requests
   - Admin management requires Super Admin role

### Database Issues

If Supabase operations fail:

1. **Run Schema Migration**
   - Execute the updated `supabase-schema.sql`
   - This ensures the admins table is created
   - Verify RLS policies are correctly configured

2. **Check Service Role Key**
   - The leaderboard trigger uses service role privileges
   - Ensure service role key is configured in Supabase
   - Admin management requires service role access

3. **Verify Initial Super Admin**
   - Check that femiadeleke2020@gmail.com exists in admins table
   - Ensure the initial seed query ran successfully
   - Manually add the super admin if needed via SQL

## Production Deployment

For production deployment:

1. **Set Environment Variables**
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `SUPABASE_SERVICE_ROLE_KEY` for admin operations
   - Use production Supabase credentials

2. **Configure Clerk**
   - Set up Clerk for production
   - Configure allowed domains
   - Enable production authentication

3. **Database Setup**
   - Run the schema migration on production database
   - This will create the admins table and seed the initial super admin
   - Verify RLS policies are enabled
   - Test admin access with production credentials

4. **Initial Admin Setup**
   - The schema migration will automatically seed femiadeleke2020@gmail.com as super admin
   - Sign in with this account to access the admin panel
   - Use the Admin Users page to add additional admins
   - Remove or modify the initial super admin if needed

5. **Monitor Access**
   - Set up logging for admin operations
   - Monitor for unauthorized access attempts
   - Regular security audits via Admin Users page
