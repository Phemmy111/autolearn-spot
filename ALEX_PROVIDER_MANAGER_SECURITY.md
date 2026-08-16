# ALEX Provider Manager Security Documentation

## Overview

The ALEX Provider Manager implements database-driven multi-provider management with built-in security features to protect API keys and ensure only authorized administrators can manage providers.

## Security Features

### 1. API Key Encryption

**Mechanism:** AES-256-GCM encryption

- All API keys are encrypted before storage in the database
- Uses a 32-byte encryption key from environment variable `ALEX_PROVIDER_ENCRYPTION_KEY`
- Each encryption uses a random IV (Initialization Vector) for security
- AuthTag is used for integrity verification

**Implementation:**
- Encryption: `lib/alex/provider/provider-manager.ts` - `encrypt()` function
- Decryption: Happens in-memory only when needed for API calls
- Keys are never returned to the client (API routes filter them out)

**Setup:**
```bash
# Generate a secure 32-byte encryption key
openssl rand -base64 32

# Add to .env
ALEX_PROVIDER_ENCRYPTION_KEY=<your-32-byte-key>
```

### 2. Access Control

**Database Level (RLS):**
- `alex_provider_config` table has Row Level Security enabled
- Only active admins can SELECT, INSERT, UPDATE, DELETE provider configurations
- Policies are defined in `migrations/alex-core-schema.sql`

**API Level:**
- All admin API routes use `requireSuperAdmin()` middleware
- This verifies the user is a super admin before allowing any operations
- Routes:
  - `GET/POST /api/admin/alex-providers`
  - `PATCH/DELETE /api/admin/alex-providers/[id]`
  - `POST /api/admin/alex-providers/[id]/test`
  - `POST /api/admin/alex-providers/[id]/models`

### 3. Provider Type Validation

**Supported Types:**
- `self_hosted` - Self-hosted OpenAI-compatible servers (Ollama, vLLM)
- `groq` - Groq API
- `openrouter` - OpenRouter API
- `openai` - OpenAI API
- `gemini` - Google Gemini API
- `openai_compatible` - Custom OpenAI-compatible endpoints

**Validation:**
- Database CHECK constraint ensures only valid types
- API level validation in creation endpoint
- Provider factory validates type before adapter creation

### 4. Authentication Type Support

**Supported Auth Types:**
- `bearer` - Bearer token (default for most providers)
- `none` - No authentication (for self-hosted)
- `api_key` - API key header
- `custom` - Custom authorization header

**Validation:**
- Self-hosted providers default to `none`
- Other providers default to `bearer`
- Database CHECK constraint ensures valid types

### 5. Health Monitoring & Failure Tracking

**Automatic Health Tracking:**
- Health status: `healthy`, `degraded`, `unavailable`, `unknown`
- Consecutive failure count triggers automatic unavailability
- Latency tracking for performance monitoring
- Last success timestamp for uptime tracking

**Failure Handling:**
- Providers marked as `unavailable` after 3 consecutive failures
- Degraded status after 1 failure
- Auto-recovery on successful request

### 6. Rate Limiting & Cost Controls

**Cost Controls (from existing system):**
- Max tokens per request
- Temperature control
- Daily request limits
- Monthly request limits
- Request timeout

**Usage Tracking:**
- All requests logged to `alex_usage` table
- Token counts tracked
- Estimated costs calculated
- User attribution for audit trail

## Security Best Practices

### For Administrators

1. **Never share API keys in chat or email**
2. **Use environment-specific keys** (dev/staging/production)
3. **Rotate API keys regularly** via the admin UI
4. **Monitor usage logs** for unusual activity
5. **Set appropriate request limits** to prevent abuse
6. **Use provider-specific keys** when possible (not shared across services)

### For Developers

1. **Never log API keys** (even encrypted)
2. **Never return API keys** in API responses
3. **Always use service role client** for admin operations
4. **Validate all inputs** before database operations
5. **Use prepared statements** (handled by Supabase client)
6. **Keep encryption key secure** - never commit to git

### For Deployment

1. **Set ALEX_PROVIDER_ENCRYPTION_KEY** in production
2. **Use different keys per environment**
3. **Enable database backups** (encrypted keys are backed up)
4. **Monitor health status** for early failure detection
5. **Set up alerts** for consecutive failures
6. **Review RLS policies** after any schema changes

## Audit Trail

The system maintains audit trails through:

1. **alex_usage table** - All AI requests with:
   - User ID
   - Provider used
   - Model used
   - Token counts
   - Timestamp
   - Success/failure status

2. **alex_provider_config timestamps** - Track:
   - When provider was created
   - When it was last updated
   - Last health check
   - Last successful request

3. **Database triggers** - Automatically update timestamps

## Compliance Notes

- **API keys are encrypted at rest** using industry-standard AES-256-GCM
- **Access is restricted to authorized admins** via RLS and API middleware
- **Audit logging** tracks all provider usage
- **No PII is stored** in provider configurations
- **Self-hosted option** allows keeping data on-premises

## Incident Response

If a security incident is suspected:

1. **Immediately disable** affected providers via admin UI
2. **Rotate API keys** at the provider
3. **Review usage logs** for unauthorized access
4. **Check encryption key** hasn't been compromised
5. **Update RLS policies** if access control needs tightening
6. **Notify users** if their data may have been affected

## Further Security Enhancements (Future)

Potential future security improvements:

1. **Key rotation automation** - Automatic periodic key rotation
2. **IP whitelisting** - Restrict API calls to specific IPs
3. **Request signing** - Additional authentication layer
4. **Audit log encryption** - Encrypt sensitive audit data
5. **Zero-knowledge proofs** - Verify keys without revealing them
6. **Hardware security modules** - Store keys in HSMs
