# Setup Guide

This guide documents all required environment variables for running the Autolearn application in production.

## Environment Variables

### Authentication

#### CLERK_SECRET_KEY
- **Type**: Secret
- **Purpose**: Server-side authentication key for Clerk
- **Where to obtain**: Clerk Dashboard → API Keys → Secret Key
- **Example**: `sk_live_your_secret_key_here`
- **Notes**: Never expose this value in client-side code or public repositories

#### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- **Type**: Public
- **Purpose**: Client-side authentication key for Clerk
- **Where to obtain**: Clerk Dashboard → API Keys → Publishable Key
- **Example**: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Notes**: Safe to expose in browser, but should still be kept in environment variables

### Database

#### NEXT_PUBLIC_SUPABASE_URL
- **Type**: Public
- **Purpose**: Supabase project URL for database connections
- **Where to obtain**: Supabase Dashboard → Project Settings → API → Project URL
- **Example**: `https://xxxxxxxxxxxxx.supabase.co`
- **Notes**: Required for both client and server-side database operations

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type**: Public
- **Purpose**: Supabase anonymous key for public API access
- **Where to obtain**: Supabase Dashboard → Project Settings → API → anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Notes**: This key has limited permissions controlled by RLS policies

#### SUPABASE_SERVICE_ROLE_KEY
- **Type**: Secret
- **Purpose**: Supabase service role key for admin operations (bypasses RLS)
- **Where to obtain**: Supabase Dashboard → Project Settings → API → service_role key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Notes**: Never expose this value. Used only on server-side for admin operations and triggers

### AI Services

#### OPENROUTER_API_KEY
- **Type**: Secret
- **Purpose**: API key for OpenRouter to access AI models (Claude 3.5 Sonnet)
- **Where to obtain**: OpenRouter Dashboard → API Keys
- **Example**: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Notes**: Used for AI quiz generation. Keep secret and monitor usage costs

### Administration

#### ADMIN_EMAILS
- **Type**: Secret
- **Purpose**: Comma-separated list of email addresses authorized for admin access
- **Where to obtain**: Your own email addresses (no external service)
- **Example**: `admin@example.com,instructor@example.com,moderator@example.com`
- **Notes**: Emails are case-insensitive. Separate multiple emails with commas. Only these users can access `/admin` routes

### Application

#### NEXT_PUBLIC_APP_URL
- **Type**: Public
- **Purpose**: Base URL of the application for redirects and API referers
- **Where to obtain**: Your domain name or deployment URL
- **Example**: `https://your-app-domain.com`
- **Notes**: Required for proper authentication redirects and API referer headers

## Setup Instructions

### 1. Local Development

Create a `.env.local` file in the project root:

```env
# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key

# Administration
ADMIN_EMAILS=your-email@example.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Production Deployment

For production deployment (e.g., Vercel, Netlify, etc.):

1. **Set environment variables in your hosting platform**
   - Go to your deployment platform's settings
   - Add each variable from the list above
   - Use production values (not development keys)

2. **Update Clerk configuration**
   - Set allowed domains in Clerk Dashboard
   - Configure production authentication URLs
   - Enable production mode

3. **Configure Supabase**
   - Ensure RLS policies are enabled
   - Run the database schema migration
   - Verify service role key is correctly set
   - Set up database backups

4. **Test configuration**
   - Verify all environment variables are loaded
   - Test authentication flow
   - Test database connections
   - Test admin access with authorized email

### 3. Security Best Practices

- **Never commit `.env.local` to version control**
- **Use different keys for development and production**
- **Rotate API keys regularly**
- **Monitor API usage and costs**
- **Keep service role keys strictly server-side**
- **Use environment-specific configurations**
- **Implement secret management for production**

### 4. Troubleshooting

#### Clerk Authentication Issues
- Verify `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are correct
- Check allowed domains in Clerk Dashboard
- Ensure redirect URLs match your application URL

#### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that RLS policies are properly configured
- Ensure service role key has necessary permissions
- Test connection using Supabase Dashboard's SQL Editor

#### Admin Access Denied
- Verify your email is in `ADMIN_EMAILS`
- Check email format (no extra spaces)
- Ensure you're signed in with the correct email
- Restart development server after changing `ADMIN_EMAILS`

#### AI Generation Fails
- Verify `OPENROUTER_API_KEY` is valid
- Check OpenRouter API status
- Monitor API usage limits
- Review error logs for specific failure reasons

## Required Services

Before deployment, ensure you have accounts set up for:

1. **Clerk** - Authentication and user management
2. **Supabase** - Database and real-time features
3. **OpenRouter** - AI model access for quiz generation

## Database Setup

After configuring environment variables:

1. Run the Supabase schema migration:
   - Open Supabase Dashboard → SQL Editor
   - Execute the contents of `supabase-schema.sql`
   - Verify all tables and policies are created

2. Test database connection:
   - Run the application locally
   - Try creating a test quiz
   - Verify data appears in Supabase Dashboard

## Production Checklist

Before launching:

- [ ] All environment variables configured in production
- [ ] Clerk production keys configured
- [ ] Supabase production project created
- [ ] Database schema migrated
- [ ] RLS policies enabled and tested
- [ ] Admin email list finalized
- [ ] OpenRouter API key configured
- [ ] Domain name configured
- [ ] SSL/HTTPS enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and logging set up
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
