# AI Provider Manager - Production Deployment Checklist

## Pre-Deployment Requirements

### Environment Variables
- [ ] Set `AI_PROVIDER_ENCRYPTION_KEY` to a strong 32-character random string
- [ ] Remove or deprecate `OPENROUTER_API_KEY` environment variable (no longer needed)
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set for admin operations
- [ ] Verify Clerk environment variables are configured

### Database Migration
- [ ] Run updated `supabase-schema.sql` on production database
- [ ] Verify `ai_providers` table exists with proper indexes
- [ ] Verify `ai_prompts` table exists with proper indexes
- [ ] Verify `ai_usage_logs` table exists with proper indexes
- [ ] Verify `ai_cost_controls` table exists with proper indexes
- [ ] Verify RLS policies are enabled on all AI tables
- [ ] Verify initial cost controls are seeded
- [ ] Verify initial super admin is seeded

## Security Verification

### API Key Security
- [ ] API keys are encrypted with AES-256-GCM before storage
- [ ] Encryption key is stored only in server-side environment variables
- [ ] Decrypted API keys are never exposed to frontend
- [ ] API keys are decrypted only in memory immediately before API calls
- [ ] No API keys are logged in console or error messages
- [ ] No API keys are exposed in API responses

### Access Control
- [ ] All AI provider CRUD routes require Super Admin access
- [ ] AI cost controls require Super Admin access
- [ ] AI health dashboard requires Admin access
- [ ] AI playground requires Admin access
- [ ] Quiz generation requires Admin access
- [ ] RLS policies block direct database access

### Data Protection
- [ ] Prompts are truncated to 1000 characters in logs (no full prompts logged)
- [ ] Error messages don't expose sensitive information
- [ ] Admin user IDs are logged but not user emails
- [ ] Provider names are logged but not API keys

## Functionality Verification

### Provider Management
- [ ] Can add new AI providers via admin dashboard
- [ ] Can edit existing AI providers
- [ ] Can delete AI providers
- [ ] Can set default provider
- [ ] Can test provider connections
- [ ] Can fetch models from providers
- [ ] Provider status is correctly displayed

### Failover Logic
- [ ] Default provider is tried first
- [ ] If default fails, other active providers are tried
- [ ] Successful provider is logged
- [ ] All providers failing returns clear error message
- [ ] Failover doesn't interrupt admin workflow

### Prompt Management
- [ ] Initial quiz generation prompt is seeded
- [ ] Can create new prompt versions
- [ ] Can edit existing prompts
- [ ] Can set active prompt
- [ ] Only one prompt per type can be active
- [ ] Quiz generation uses active prompt
- [ ] Prompt version history is maintained

### Usage Logging
- [ ] Every AI request is logged
- [ ] Logs include timestamp, admin user, provider, model
- [ ] Logs include response time, success/failure
- [ ] Logs include error messages (if any)
- [ ] Logs include token usage (when available)
- [ ] Logs are truncated to avoid storing full prompts

### Cost Controls
- [ ] Cost controls are seeded with defaults
- [ ] Can configure max tokens per request
- [ ] Can configure temperature
- [ ] Can configure daily request limit
- [ ] Can configure monthly request limit
- [ ] Can configure max retries
- [ ] Can configure request timeout
- [ ] Can enable/disable cost controls
- [ ] Limits are enforced before API calls

### Health Dashboard
- [ ] Active provider is displayed
- [ ] Active model is displayed
- [ ] Last successful request time is shown
- [ ] Last failed request time is shown
- [ ] Average response time is calculated
- [ ] Provider status is shown for all providers
- [ ] Total requests today is displayed
- [ ] Success rate is calculated
- [ ] Token usage today is displayed

## Integration Verification

### Quiz Generation
- [ ] Quiz generation uses AI Provider Manager
- [ ] Quiz generation uses active prompt from database
- [ ] Quiz generation respects cost controls
- [ ] Quiz generation logs usage
- [ ] Quiz generation supports provider failover
- [ ] Existing quiz generation still works

### AI Playground
- [ ] Playground uses AI Provider Manager
- [ ] Playground respects cost controls
- [ ] Playground logs usage
- [ ] Playground supports provider selection
- [ ] Playground supports model selection
- [ ] Playground can refresh models

## Performance Verification

### Response Times
- [ ] Provider selection is fast (< 100ms)
- [ ] Encryption/decryption is fast (< 10ms)
- [ ] Logging doesn't block main flow
- [ ] Health dashboard loads quickly
- [ ] Cost controls check is fast

### Database Performance
- [ ] Indexes are created on frequently queried columns
- [ ] RLS policies don't significantly impact performance
- [ ] Usage logs queries are optimized
- [ ] Provider queries are optimized

## Monitoring & Observability

### Logging
- [ ] Provider success/failure is logged
- [ ] Failover events are logged
- [ ] Cost control violations are logged
- [ ] Errors are logged with context
- [ ] No sensitive data is logged

### Metrics
- [ ] Can track total AI requests
- [ ] Can track success rate
- [ ] Can track average response time
- [ ] Can track token usage
- [ ] Can track provider usage distribution

## Documentation

### User Documentation
- [ ] AI_PROVIDER_GUIDE.md is updated
- [ ] ADMIN_GUIDE.md mentions AI Provider Manager
- [ ] SETUP_GUIDE.md mentions AI_PROVIDER_ENCRYPTION_KEY
- [ ] Migration guide from environment variables is provided

### Technical Documentation
- [ ] Code is well-commented
- [ ] API routes are documented
- [ ] Database schema is documented
- [ ] Security practices are documented

## Rollback Plan

### Database Rollback
- [ ] Database backup is created before migration
- [ ] Rollback SQL script is prepared
- [ ] Can revert to previous schema if needed

### Code Rollback
- [ ] Git tag is created before deployment
- [ ] Can revert to previous commit if needed
- [ ] Feature flags can disable new features

## Post-Deployment Verification

### Smoke Tests
- [ ] Access admin dashboard
- [ ] Access AI Providers page
- [ ] Access AI Health page
- [ ] Access AI Cost Controls page
- [ ] Access AI Playground
- [ ] Generate a test quiz
- [ ] Test provider failover

### Monitoring
- [ ] Check error logs for AI-related errors
- [ ] Verify usage logs are being created
- [ ] Verify health dashboard shows correct data
- [ ] Monitor response times
- [ ] Monitor success rate

## Final Sign-Off

### Security Review
- [ ] No API keys exposed to client
- [ ] No secrets logged
- [ ] All AI requests use centralized manager
- [ ] Existing quiz generation works
- [ ] Existing providers migrated safely
- [ ] No breaking changes introduced

### Production Readiness
- [ ] All checklist items completed
- [ ] Team has reviewed changes
- [ ] Stakeholders have approved deployment
- [ ] Deployment window is scheduled
- [ ] Monitoring is configured
- [ ] Rollback plan is documented

---

## Notes

### Encryption Key Generation
Generate a secure 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Migration Command
```bash
psql -h your-host -U your-user -d your-database -f supabase-schema.sql
```

### Verification Queries
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'ai_%';

-- Check initial data
SELECT * FROM ai_cost_controls;
SELECT * FROM admins WHERE email = 'femiadeleke2020@gmail.com';
```

### Health Check Endpoint
Test the AI health endpoint:
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/admin/ai-health
```

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Approved By**: _______________
**Rollback Contact**: _______________
