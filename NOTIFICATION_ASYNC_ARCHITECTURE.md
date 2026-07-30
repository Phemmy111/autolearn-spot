# Notification Asynchronous Delivery Architecture

## Current Implementation Analysis

### Current State
The notification system currently uses **synchronous delivery** for all channels:

1. **In-App Notifications**: Synchronous database insert into `notifications` and `notification_deliveries` tables
2. **Email Notifications**: Synchronous calls to `sendEmail()` using Nodemailer
3. **Web Push Notifications**: Synchronous calls to `webpush.sendNotification()` with error handling

### Current Behavior
- All notification delivery happens in the same request/response cycle as the primary business logic
- Email and web push failures are caught in try-catch blocks but do not fail the primary workflow
- This means notification delivery can add latency to the primary workflow (especially for bulk notifications to large cohorts)

### Non-Blocking Guarantees
✅ **Primary workflows are protected**: All notification calls are wrapped in try-catch blocks that prevent notification failures from interrupting business logic

⚠️ **Latency concern**: For bulk notifications (e.g., "all students"), the synchronous email and push delivery can add significant latency

---

## Recommended Asynchronous Architecture

### Proposed Solution: Background Job Queue

#### Option 1: Lightweight In-Memory Queue (Short-term)
**Best for**: Immediate implementation with minimal infrastructure changes

**Architecture**:
```
Business Logic → Create Notification Record → Queue Job → Background Worker → Delivery
```

**Implementation**:
- Use a simple in-memory queue (e.g., `bull` with Redis, or a simple array-based queue)
- Store notification jobs in a `notification_jobs` table for persistence
- Background worker processes jobs independently

**Pros**:
- Quick to implement
- Minimal infrastructure changes
- Good for current scale

**Cons**:
- Single point of failure if worker crashes
- Limited horizontal scaling

#### Option 2: Cloud-Native Queue (Recommended for Production)
**Best for**: Long-term scalability and reliability

**Architecture**:
```
Business Logic → Create Notification Record → Cloud Queue (SQS/Cloud Tasks) → Worker Functions → Delivery
```

**Implementation Options**:
- **AWS**: SQS + Lambda functions
- **Google Cloud**: Cloud Tasks + Cloud Functions
- **Vercel**: Vercel Cron Jobs + Edge Functions
- **Supabase**: Supabase Edge Functions + pg_notify

**Pros**:
- Highly scalable and reliable
- Built-in retry mechanisms
- Horizontal scaling
- Separation of concerns

**Cons**:
- Requires additional infrastructure setup
- Slightly more complex deployment

---

## Recommended Implementation: Hybrid Approach

### Phase 1: Immediate (Current)
- Keep current synchronous implementation
- Add job queuing table for future migration
- Document the architecture decision

### Phase 2: Short-term (Next Sprint)
- Implement lightweight job queue using Supabase Edge Functions
- Move email delivery to background jobs
- Keep in-app notifications synchronous (fast enough)

### Phase 3: Long-term (Scale Preparation)
- Move all delivery channels to background jobs
- Implement retry logic with exponential backoff
- Add monitoring and alerting for failed deliveries

---

## Detailed Architecture Recommendation

### Database Schema Addition

```sql
-- Notification Jobs Table
CREATE TABLE notification_jobs (
  id BIGSERIAL PRIMARY KEY,
  notification_id BIGINT NOT NULL REFERENCES notifications(id),
  job_type TEXT NOT NULL CHECK (job_type IN ('email', 'push', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_jobs_status ON notification_jobs(status, scheduled_at);
CREATE INDEX idx_notification_jobs_notification ON notification_jobs(notification_id);
```

### Background Worker Pattern

```typescript
// lib/notification-worker.ts
export async function processNotificationJobs() {
  const { data: jobs } = await supabaseAdmin
    .from('notification_jobs')
    .select('*, notifications(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10)
    .order('scheduled_at', { ascending: true });

  for (const job of jobs) {
    try {
      await supabaseAdmin
        .from('notification_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', job.id);

      // Process based on job type
      if (job.job_type === 'email') {
        await sendEmailNotification(job.notifications);
      } else if (job.job_type === 'push') {
        await sendPushNotification(job.notifications);
      }

      await supabaseAdmin
        .from('notification_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id);
    } catch (error) {
      const attempts = job.attempts + 1;
      if (attempts >= job.max_attempts) {
        await supabaseAdmin
          .from('notification_jobs')
          .update({ 
            status: 'failed', 
            attempts,
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      } else {
        // Exponential backoff
        const backoffMs = Math.pow(2, attempts) * 1000;
        const nextAttemptAt = new Date(Date.now() + backoffMs).toISOString();
        
        await supabaseAdmin
          .from('notification_jobs')
          .update({ 
            status: 'pending', 
            attempts,
            scheduled_at: nextAttemptAt
          })
          .eq('id', job.id);
      }
    }
  }
}
```

### Supabase Edge Function Worker

```typescript
// supabase/functions/notification-worker/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { processNotificationJobs } from '../../lib/notification-worker.ts'

serve(async (req) => {
  await processNotificationJobs()
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Cron Job Scheduling

```yaml
# Vercel Cron Configuration
# vercel.json
{
  "crons": [
    {
      "path": "/api/cron/notification-worker",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

---

## Migration Strategy

### Step 1: Add Infrastructure (No Breaking Changes)
- Add `notification_jobs` table
- Create background worker function
- Deploy to edge function

### Step 2: Gradual Migration
- Start with email notifications only (highest latency)
- Test with low-volume notifications
- Monitor for failures

### Step 3: Full Migration
- Move push notifications to background
- Keep in-app notifications synchronous (fast)
- Add monitoring and alerting

### Step 4: Optimization
- Implement batch processing for bulk notifications
- Add priority queues for urgent notifications
- Implement dead letter queue for failed jobs

---

## Monitoring and Observability

### Key Metrics to Track
- Job queue length
- Average processing time
- Failure rate by channel
- Retry rate
- Delivery latency

### Recommended Monitoring
- Supabase Dashboard for job table metrics
- Vercel Analytics for edge function performance
- Custom alerts for high failure rates

---

## Conclusion

**Current Status**: Production-ready for current scale with synchronous delivery

**Recommended Action**: 
1. Keep current implementation for now
2. Add `notification_jobs` table as preparation
3. Implement background worker in next sprint when scale increases
4. Monitor notification delivery latency as user base grows

**Risk Assessment**: LOW - Current implementation is non-blocking and protected by error handling. Asynchronous migration can be done incrementally without downtime.
