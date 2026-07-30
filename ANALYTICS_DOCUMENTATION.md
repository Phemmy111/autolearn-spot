# Student Progress Analytics - Documentation

## Overview
The Student Progress Analytics module provides a centralized, production-ready analytics service for tracking and reporting student progress across all learning activities in AutoLearn Spot.

## Architecture

### Service Layer
```
lib/analytics/
├── index.ts                    # Main entry point
├── types.ts                    # TypeScript interfaces
├── progress-calculator.ts     # Core progress calculations
├── student-analytics.ts        # Student-specific analytics
├── cohort-analytics.ts        # Cohort/admin analytics
├── cache-manager.ts           # Caching layer
└── integration.ts             # Workflow integration utilities
```

### API Layer
```
app/api/analytics/
├── student/
│   ├── progress/route.ts      # Student progress overview
│   ├── assignments/route.ts  # Assignment performance
│   ├── quizzes/route.ts       # Quiz performance
│   └── activity/route.ts     # Login/activity timeline
└── admin/
    ├── cohort/route.ts       # Cohort-wide analytics
    ├── students/route.ts     # Student list with metrics
    ├── engagement/route.ts    # Engagement metrics
    └── performance/route.ts   # Performance distribution
```

### Dashboard Layer
```
app/dashboard/analytics/page.tsx    # Student analytics dashboard
app/admin/analytics/progress/page.tsx  # Admin analytics dashboard
```

---

## Database Schema

### New Tables

#### student_analytics_snapshot
Stores periodic snapshots of student progress for historical tracking.

```sql
CREATE TABLE student_analytics_snapshot (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  snapshot_date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  lessons_total INTEGER DEFAULT 0,
  lessons_percentage DECIMAL(5,2) DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  assignments_total INTEGER DEFAULT 0,
  assignments_percentage DECIMAL(5,2) DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_total INTEGER DEFAULT 0,
  quizzes_average_score DECIMAL(5,2) DEFAULT 0,
  overall_progress DECIMAL(5,2) DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, cohort_id, snapshot_date)
);
```

#### login_activity
Tracks student login activity for engagement analytics.

```sql
CREATE TABLE login_activity (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID REFERENCES cohorts(id),
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_duration_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Indexes

Indexes added to existing tables for performance:
- `idx_lesson_progress_completed` - Filtered index on completed lessons
- `idx_lesson_progress_updated_at` - For recent activity queries
- `idx_lesson_progress_cohort_user_completed` - Composite index for user progress
- `idx_submissions_assignment_score` - For assignment performance
- `idx_submissions_user_status` - For student submission status
- `idx_submissions_created_at` - For recent submissions
- `idx_quiz_responses_user_score` - For quiz performance
- `idx_quiz_responses_quiz_cohort` - For cohort quiz analytics
- `idx_quiz_responses_user_quiz` - For student quiz history
- `idx_certificates_issued_at` - For certificate analytics
- `idx_leaderboard_cohort_score_updated` - Enhanced leaderboard queries

---

## API Endpoints

### Student Endpoints

#### GET /api/analytics/student/progress
Returns comprehensive student progress overview.

**Authentication**: Required (Clerk)

**Response**:
```typescript
{
  analytics: {
    userId: string
    cohortId: string
    overallProgress: {
      percentage: number
      status: 'on_track' | 'behind' | 'ahead' | 'completed'
      estimatedCompletionDate: string | null
    }
    videoProgress: {
      completed: number
      total: number
      percentage: number
      averageWatchPct: number
      lastActivityAt: string | null
    }
    assignmentProgress: {
      submitted: number
      total: number
      percentage: number
      averageScore: number
      onTimeRate: number
      pendingReview: number
      approved: number
      needsRevision: number
      lastSubmissionAt: string | null
    }
    quizProgress: {
      completed: number
      total: number
      averageScore: number
      passRate: number
      passed: number
      lastQuizAt: string | null
    }
    certificate: {
      eligible: boolean
      issued: boolean
      issuedAt: string | null
    }
    totalScore: number
    lastActivityAt: string | null
  }
}
```

**Cache**: 5 minutes

---

#### GET /api/analytics/student/assignments
Returns detailed assignment performance.

**Authentication**: Required (Clerk)

**Response**:
```typescript
{
  performance: [
    {
      assignmentId: string
      title: string
      weekNumber: number
      submittedAt: string
      score: number | null
      status: string
      feedback: string | null
      isLate: boolean
    }
  ]
}
```

**Cache**: 5 minutes

---

#### GET /api/analytics/student/quizzes
Returns detailed quiz performance.

**Authentication**: Required (Clerk)

**Response**:
```typescript
{
  performance: [
    {
      quizId: string
      title: string
      weekNumber: number
      attemptedAt: string
      score: number
      passed: boolean
      passingScore: number
    }
  ]
}
```

**Cache**: 5 minutes

---

#### GET /api/analytics/student/activity?limit=30
Returns login/activity timeline.

**Authentication**: Required (Clerk)

**Query Parameters**:
- `limit` (optional): Number of activity records to return (default: 30)

**Response**:
```typescript
{
  activity: [
    {
      loginTime: string
      sessionDurationSeconds: number | null
      ipAddress: string | null
    }
  ]
}
```

**Cache**: 1 minute

---

### Admin Endpoints

#### GET /api/analytics/admin/cohort?cohortId={uuid}
Returns cohort-wide analytics.

**Authentication**: Admin role required

**Query Parameters**:
- `cohortId` (optional): Cohort UUID (defaults to current cohort)

**Response**:
```typescript
{
  analytics: {
    cohortId: string
    totalStudents: number
    activeStudents: number
    engagementMetrics: {
      activeStudents7d: number
      activeStudents30d: number
      averageSessionDuration: number
      averageLoginFrequency: number
      courseCompletionRate: number
    }
    performanceDistribution: {
      scoreRanges: {
        range: string
        count: number
        percentage: number
      }[]
      averageScore: number
      medianScore: number
      topPerformers: {
        userId: string
        userName: string
        score: number
      }[]
      atRiskStudents: {
        userId: string
        userName: string
        progressPercentage: number
        lastActivity: string
      }[]
    }
    averageProgress: number
    completionRate: number
  }
}
```

**Cache**: 10 minutes

---

#### GET /api/analytics/admin/students?cohortId={uuid}&sortBy={field}&sortOrder={order}
Returns student list with progress metrics.

**Authentication**: Admin role required

**Query Parameters**:
- `cohortId` (optional): Cohort UUID (defaults to current cohort)
- `sortBy` (optional): Sort field - `progress` | `score` | `name` | `activity` (default: `progress`)
- `sortOrder` (optional): Sort order - `asc` | `desc` (default: `desc`)

**Response**:
```typescript
{
  students: [
    {
      userId: string
      userName: string
      email: string
      progressPercentage: number
      totalScore: number
      lastActivityAt: string
      status: 'active' | 'inactive' | 'completed'
    }
  ]
}
```

**Cache**: 10 minutes

---

#### GET /api/analytics/admin/engagement?cohortId={uuid}
Returns engagement metrics.

**Authentication**: Admin role required

**Query Parameters**:
- `cohortId` (optional): Cohort UUID (defaults to current cohort)

**Response**:
```typescript
{
  engagementMetrics: {
    activeStudents7d: number
    activeStudents30d: number
    averageSessionDuration: number
    averageLoginFrequency: number
    courseCompletionRate: number
  }
}
```

**Cache**: 10 minutes

---

#### GET /api/analytics/admin/performance?cohortId={uuid}
Returns performance distribution.

**Authentication**: Admin role required

**Query Parameters**:
- `cohortId` (optional): Cohort UUID (defaults to current cohort)

**Response**:
```typescript
{
  performanceDistribution: {
    scoreRanges: {
      range: string
      count: number
      percentage: number
    }[]
    averageScore: number
    medianScore: number
    topPerformers: {
      userId: string
      userName: string
      score: number
    }[]
    atRiskStudents: {
      userId: string
      userName: string
      progressPercentage: number
      lastActivity: string
    }[]
  }
}
```

**Cache**: 10 minutes

---

## Service Functions

### Student Analytics

#### `getStudentProgressAnalytics(userId, cohortId?)`
Returns comprehensive student progress analytics.

```typescript
import { getStudentProgressAnalytics } from '@/lib/analytics'

const analytics = await getStudentProgressAnalytics(userId, cohortId)
```

---

#### `getStudentAssignmentPerformance(userId, cohortId?)`
Returns detailed assignment performance.

```typescript
import { getStudentAssignmentPerformance } from '@/lib/analytics'

const performance = await getStudentAssignmentPerformance(userId, cohortId)
```

---

#### `getStudentQuizPerformance(userId, cohortId?)`
Returns detailed quiz performance.

```typescript
import { getStudentQuizPerformance } from '@/lib/analytics'

const performance = await getStudentQuizPerformance(userId, cohortId)
```

---

#### `getStudentLoginActivity(userId, limit?)`
Returns login activity timeline.

```typescript
import { getStudentLoginActivity } from '@/lib/analytics'

const activity = await getStudentLoginActivity(userId, 30)
```

---

#### `recordLoginActivity(userId, cohortId, ipAddress?, userAgent?)`
Records a login event for engagement tracking.

```typescript
import { recordLoginActivity } from '@/lib/analytics'

await recordLoginActivity(userId, cohortId, ipAddress, userAgent)
```

---

#### `updateSessionDuration(userId, durationSeconds)`
Updates session duration for the most recent login.

```typescript
import { updateSessionDuration } from '@/lib/analytics'

await updateSessionDuration(userId, durationSeconds)
```

---

### Cohort Analytics

#### `getCohortAnalytics(cohortId?)`
Returns comprehensive cohort analytics.

```typescript
import { getCohortAnalytics } from '@/lib/analytics'

const analytics = await getCohortAnalytics(cohortId)
```

---

#### `getStudentList(cohortId?, sortBy?, sortOrder?)`
Returns student list with progress metrics.

```typescript
import { getStudentList } from '@/lib/analytics'

const students = await getStudentList(cohortId, 'progress', 'desc')
```

---

### Cache Management

#### `cacheStudentProgress(fn, userId, cohortId)`
Cache wrapper for student progress.

```typescript
import { cacheStudentProgress } from '@/lib/analytics'

const analytics = await cacheStudentProgress(
  () => getStudentProgressAnalytics(userId),
  userId,
  cohortId
)
```

---

#### `invalidateStudentProgressCache(userId, cohortId)`
Invalidate student progress cache.

```typescript
import { invalidateStudentProgressCache } from '@/lib/analytics'

await invalidateStudentProgressCache(userId, cohortId)
```

---

### Integration Utilities

#### `invalidateAfterLessonProgress(userId, cohortId)`
Invalidate caches after lesson progress update.

```typescript
import { invalidateAfterLessonProgress } from '@/lib/analytics/integration'

await invalidateAfterLessonProgress(userId, cohortId)
```

---

#### `invalidateAfterAssignmentSubmission(userId, cohortId)`
Invalidate caches after assignment submission.

```typescript
import { invalidateAfterAssignmentSubmission } from '@/lib/analytics/integration'

await invalidateAfterAssignmentSubmission(userId, cohortId)
```

---

#### `invalidateAfterCertificateIssuance(userId, cohortId)`
Invalidate caches after certificate issuance.

```typescript
import { invalidateAfterCertificateIssuance } from '@/lib/analytics/integration'

await invalidateAfterCertificateIssuance(userId, cohortId)
```

---

## Progress Calculations

### Overall Progress
Weighted calculation combining all activity types:
- Video progress: 40% weight
- Assignment progress: 35% weight
- Quiz progress: 25% weight

```typescript
overallPercentage = (videoPercentage * 0.4) + 
                   (assignmentPercentage * 0.35) + 
                   (quizPercentage * 0.25)
```

### Status Determination
- `completed`: 100% progress
- `ahead`: >80% progress
- `on_track`: 50-80% progress
- `behind`: <50% progress

### Certificate Eligibility
Student is eligible for certificate when:
- Video progress: 100%
- Assignments: All approved
- Quizzes: All passed

---

## Caching Strategy

### Cache TTL
- Student progress: 5 minutes
- Cohort analytics: 10 minutes
- Leaderboard: 5 minutes
- Student list: 10 minutes
- Assignment/quiz performance: 5 minutes
- Login activity: 1 minute

### Cache Invalidation
Automatic invalidation occurs on:
- Lesson progress update
- Assignment submission
- Certificate issuance
- Manual invalidation available via integration utilities

### Implementation
Uses Next.js built-in cache with tags for selective invalidation. Future enhancement: Redis for distributed caching.

---

## Integration with Existing Workflows

### Lesson Progress
Integrated with `lib/progress-service.ts`:
```typescript
// After upsertLessonProgress
await invalidateAfterLessonProgress(userId, cohortId)
```

### Assignment Submission
Integrated with `app/api/assignments/[id]/submissions/route.ts`:
```typescript
// After assignment submission
await invalidateAfterAssignmentSubmission(userId, cohortId)
```

### Certificate Issuance
Integrated with `app/api/certificate/complete/route.ts`:
```typescript
// After certificate issuance
await invalidateAfterCertificateIssuance(userId, cohortId)
```

### Login Tracking
Call `recordLoginActivity` after successful authentication to track engagement.

---

## Migration Steps

### 1. Apply Database Schema
```bash
psql -U postgres -d autolearn_spot -f migrations/analytics-schema.sql
```

### 2. Verify Migration
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_analytics_snapshot', 'login_activity');

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('lesson_progress', 'submissions', 'quiz_responses', 'certificates', 'leaderboard');
```

### 3. Deploy Code Changes
Deploy all new files to production.

### 4. Test Endpoints
Test each API endpoint to verify functionality:
- Student progress endpoint
- Admin cohort analytics endpoint
- Cache invalidation

### 5. Monitor Performance
Monitor:
- API response times
- Cache hit rates
- Database query performance

---

## Performance Considerations

### Query Optimization
- All queries use appropriate indexes
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Batch operations for bulk data

### Caching
- Expensive calculations cached
- Appropriate TTL values
- Tag-based invalidation
- Cache warming for critical data

### Scalability
- Designed for horizontal scaling
- Async processing for future enhancements
- Materialized views for complex aggregations (planned)

---

## Backward Compatibility

### Existing Systems Unchanged
- `lib/progress-service.ts` continues to work
- `app/api/progress/route.ts` continues to work
- Existing dashboard pages continue to work
- Leaderboard continues to work

### No Data Migration Required
- Analytics service reads from existing tables
- New tables are additive only
- Existing indexes remain

### Deprecation Plan
- Old progress API remains for backward compatibility
- New analytics API is the recommended path forward
- Consider deprecating old API after 6 months

---

## Security

### Access Control
- Student endpoints: authenticated user only (own data)
- Admin endpoints: admin role required
- Row-level security on all tables
- Service role key for analytics service

### Data Privacy
- No PII in analytics snapshots
- Login activity: IP address optional
- Aggregate data for cohort analytics
- Compliance with data retention policies

---

## Monitoring

### Key Metrics
- Analytics API response times
- Cache hit rates
- Database query performance
- Login activity tracking

### Alerts
- Slow query alerts (>1s)
- Cache miss rate (>50%)
- API error rate (>5%)
- Failed cache invalidation

---

## Future Enhancements

### Phase 2 (Next Sprint)
- Historical snapshots with scheduled jobs
- Trend analysis
- Predictive analytics (at-risk identification)
- Export functionality

### Phase 3 (Future)
- Materialized views for complex aggregations
- Redis for distributed caching
- Real-time analytics with WebSockets
- Advanced filtering and sorting

---

## Troubleshooting

### Cache Not Invalidating
Check that integration utilities are called after data updates. Verify cache tags are correctly configured.

### Slow Queries
Verify indexes exist. Check query execution plan with `EXPLAIN ANALYZE`.

### Missing Data
Verify user has progress records. Check cohort_id matches current cohort.

### At-Risk Students Not Showing
At-risk criteria: <50% progress AND inactive for >7 days. Verify login activity is being tracked.

---

## Support

For issues or questions:
- Review ANALYTICS_ARCHITECTURE.md for design details
- Check database migration logs
- Monitor API error logs
- Review cache hit rates
