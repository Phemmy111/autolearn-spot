# AutoLearn Spot Audit Logging System

## Overview

The Audit Logging System provides centralized monitoring and audit trail capabilities for the AutoLearn Spot Scholarship Programme. It tracks all system activities including user actions, admin operations, scholarship lifecycle events, payments, emails, and system errors.

## Features

- **Centralized Logging Service**: Reusable TypeScript functions for logging all system events
- **Scholarship Timeline**: Complete history of application status changes with admin attribution
- **Admin Dashboard**: Web interface for viewing, searching, filtering, and exporting logs
- **Sensitive Data Protection**: Automatic redaction of passwords, API keys, tokens, and other sensitive information
- **Performance Optimized**: Database indexes for efficient querying by event type, user, resource, and date
- **CSV Export**: Export filtered logs for external analysis and compliance

## Architecture

### Database Schema

#### `audit_logs` Table
Stores all system events with the following structure:

- `id`: UUID primary key
- `event_type`: Category (user_activity, admin_activity, scholarship_lifecycle, payment, email, system_error)
- `event_category`: Specific sub-category
- `event_action`: Detailed action performed
- `user_id`: Clerk user ID (if applicable)
- `user_email`: User email address
- `user_role`: User role (admin, student, etc.)
- `resource_type`: Type of resource affected
- `resource_id`: ID of the resource
- `resource_reference`: Reference number or external ID
- `description`: Human-readable description
- `metadata`: JSONB for additional structured data
- `ip_address`: Request IP address
- `user_agent`: Browser/user agent
- `status`: success, failure, or warning
- `error_message`: Error details if applicable
- `error_code`: Error code for debugging
- `created_at`: Timestamp

#### `scholarship_timeline` Table
Tracks scholarship application status changes:

- `id`: UUID primary key
- `application_id`: Reference to scholarship application
- `reference_number`: Application reference number
- `from_status`: Previous status (NULL for initial)
- `to_status`: New status
- `admin_id`: Clerk user ID of admin who made the change
- `admin_email`: Admin email address
- `admin_name`: Admin name
- `notes`: Additional notes about the transition
- `reason`: Reason for the status change
- `created_at`: Timestamp

### Logging Service

Located at `lib/audit-logging.ts`, the service provides:

- **TypeScript Types**: `AuditLogEntry`, `TimelineEntry`, `EventType`, `EventCategory`, `EventStatus`
- **Core Functions**:
  - `logAuditEvent()`: Main logging function
  - `logScholarshipTimeline()`: Timeline logging
  - `redactSensitiveData()`: Automatic sensitive data redaction
- **Convenience Functions**:
  - `logUserActivity()`: User-related events
  - `logAdminActivity()`: Admin-related events
  - `logScholarshipEvent()`: Scholarship lifecycle events
  - `logPaymentEvent()`: Payment-related events
  - `logEmailEvent()`: Email-related events
  - `logSystemError()`: System error logging
- **Query Functions**:
  - `getAuditLogs()`: Fetch logs with filtering
  - `getAuditLogsCount()`: Count logs matching filters
  - `getScholarshipTimeline()`: Fetch application timeline

## Installation

### 1. Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```bash
# File: migrations/audit-logging/001_create_audit_tables.sql
```

This creates:
- `audit_logs` table with RLS policies
- `scholarship_timeline` table with RLS policies
- Performance indexes
- Row Level Security policies

### 2. Verify Environment Variables

Ensure the following are set in your environment:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required for server-side logging)

## Usage

### Basic Logging

```typescript
import { logAuditEvent } from '@/lib/audit-logging';

await logAuditEvent({
  event_type: 'user_activity',
  event_category: 'authentication',
  event_action: 'user_logged_in',
  user_email: 'user@example.com',
  description: 'User logged in successfully',
  status: 'success',
});
```

### Convenience Functions

#### Log User Activity
```typescript
import { logUserActivity } from '@/lib/audit-logging';

await logUserActivity({
  action: 'profile_updated',
  user_email: 'user@example.com',
  description: 'User updated their profile',
});
```

#### Log Admin Activity
```typescript
import { logAdminActivity } from '@/lib/audit-logging';

await logAdminActivity({
  action: 'status_changed',
  admin_id: 'admin_user_id',
  resource_type: 'scholarship_application',
  resource_id: 'app_id',
  description: 'Changed application status',
});
```

#### Log Scholarship Event
```typescript
import { logScholarshipEvent } from '@/lib/audit-logging';

await logScholarshipEvent({
  action: 'application_submitted',
  user_email: 'applicant@example.com',
  application_id: 'app_id',
  reference_number: 'ALS-2024-1234',
  description: 'Scholarship application submitted',
});
```

#### Log Payment Event
```typescript
import { logPaymentEvent } from '@/lib/audit-logging';

await logPaymentEvent({
  action: 'payment_verified',
  user_email: 'user@example.com',
  payment_reference: 'paystack_ref',
  amount: 5000,
  description: 'Payment verified successfully',
});
```

#### Log Email Event
```typescript
import { logEmailEvent } from '@/lib/audit-logging';

await logEmailEvent({
  action: 'welcome_email',
  recipient_email: 'user@example.com',
  email_type: 'welcome',
  subject: 'Welcome to AutoLearn Spot',
  description: 'Welcome email sent',
  status: 'success',
});
```

#### Log System Error
```typescript
import { logSystemError } from '@/lib/audit-logging';

await logSystemError({
  action: 'database_query',
  category: 'database_error',
  error_message: 'Connection failed',
  error_code: 'DB001',
  description: 'Database connection error',
});
```

### Timeline Logging

```typescript
import { logScholarshipTimeline } from '@/lib/audit-logging';

await logScholarshipTimeline({
  application_id: 'app_id',
  reference_number: 'ALS-2024-1234',
  from_status: 'Submitted',
  to_status: 'Under Review',
  admin_id: 'admin_user_id',
  admin_email: 'admin@example.com',
  reason: 'Admin status change',
  notes: 'Application moved to review',
});
```

## Admin Dashboard

Access the audit logs dashboard at `/admin/logs`

### Features

- **Statistics Overview**: Total events, success/failure counts
- **Filtering**: By event type, status, user email, resource type
- **Search**: Full-text search in descriptions
- **Pagination**: 50 entries per page
- **CSV Export**: Export filtered logs for analysis

### Timeline View

View application timeline in the scholarship admin panel:
1. Navigate to `/admin/scholarship`
2. Click the "View & Edit" button on any application
3. Timeline appears in the right panel showing all status changes

## Security

### Sensitive Data Redaction

The logging service automatically redacts sensitive data from:
- Passwords
- OTP codes
- API keys
- Secrets
- Tokens
- Authorization headers
- Credit card numbers
- CVV codes
- SSN numbers

Redaction is applied to:
- `metadata` field
- `description` field
- `user_email` field

### Row Level Security

- **Audit Logs**: Only admins can read; service role can insert
- **Timeline**: Only admins can read; service role can insert

## Performance

### Database Indexes

The schema includes optimized indexes for:
- Event type and date (composite)
- User email and date (composite)
- Resource type, ID, and date (composite)
- Individual indexes on all filterable fields

### Query Optimization

- Use specific filters to leverage indexes
- Limit pagination to reasonable page sizes (default: 50)
- Export limits to 10,000 records for performance

## Integration Points

### Current Integrations

1. **Scholarship Application Submission** (`app/scholarship/actions.ts`)
   - Logs application submission
   - Creates initial timeline entry
   - Logs confirmation email

2. **Payment Webhook** (`app/api/webhooks/paystack/route.ts`)
   - Logs webhook receipt
   - Logs payment verification
   - Logs welcome email sending
   - Creates timeline entry

3. **Admin Actions** (`app/admin/scholarship/actions.ts`)
   - Logs status changes
   - Logs admin notes updates
   - Logs payment status changes
   - Creates timeline entries for all status changes

4. **OTP Generation** (`app/scholarship/actions.ts`)
   - Logs OTP generation
   - Logs OTP email sending

### Adding New Integrations

To add logging to a new feature:

1. Import the appropriate logging function
2. Call the function at relevant points in your code
3. Include relevant metadata for debugging
4. Handle errors gracefully (logging functions don't throw)

Example:
```typescript
import { logUserActivity } from '@/lib/audit-logging';

try {
  // Your operation
  await performOperation();
  
  await logUserActivity({
    action: 'operation_completed',
    user_email: user.email,
    description: 'Operation completed successfully',
    status: 'success',
  });
} catch (error) {
  await logUserActivity({
    action: 'operation_failed',
    user_email: user.email,
    description: 'Operation failed',
    status: 'failure',
    error_message: error.message,
  });
  throw error;
}
```

## Maintenance

### Log Retention

Consider implementing log retention policies:
- Archive logs older than 90 days
- Keep error logs for 1 year
- Purge sensitive logs after compliance period

### Monitoring

Monitor the following metrics:
- Log volume growth rate
- Error log frequency
- Failed email notifications
- Unusual admin activity patterns

### Backup

Ensure regular backups of:
- `audit_logs` table
- `scholarship_timeline` table
- Related application data

## Troubleshooting

### Logs Not Appearing

1. Check database migration was run successfully
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check RLS policies allow service role inserts
4. Review console for logging function errors

### Timeline Not Showing

1. Verify `getApplicationTimeline` is being called
2. Check timeline entries exist in database
3. Ensure application ID is correct
4. Review RLS policies for timeline table

### Export Failing

1. Check export limit (max 10,000 records)
2. Verify filters are not too restrictive
3. Check browser console for errors
4. Ensure sufficient memory for large exports

## Compliance

The audit logging system supports:
- **Audit Trail**: Complete history of system activities
- **Attribution**: Admin and user identification for all actions
- **Non-Repudiation**: Timestamped records with immutable history
- **Data Protection**: Automatic sensitive data redaction
- **Export Capability**: CSV export for external compliance tools

## Support

For issues or questions:
1. Check this documentation
2. Review the `lib/audit-logging.ts` source code
3. Check the database migration file
4. Review integration examples in existing code
