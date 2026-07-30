# Student Progress Analytics Architecture

## Overview
Centralized analytics service for tracking and reporting student progress across all learning activities in AutoLearn Spot.

## Current State Analysis

### Existing Data Sources
1. **lesson_progress** table - Video watch progress and completion
2. **submissions** table - Assignment submissions and grading
3. **quiz_responses** table - Quiz attempts and scores
4. **certificates** table - Certificate issuance
5. **leaderboard** table - Aggregated scores
6. **enrollments** table - Student enrollment status

### Existing Services
- `lib/progress-service.ts` - Lesson progress tracking (video only)
- `app/api/progress/route.ts` - Progress API endpoint
- `app/api/leaderboard/route.ts` - Leaderboard API

### Gaps Identified
- No centralized analytics service
- No comprehensive progress calculations across all activities
- No student dashboard with detailed analytics
- No admin dashboard with cohort-wide analytics
- No login activity tracking
- No performance metrics (time to complete, engagement patterns)
- No caching for expensive calculations
- No historical progress tracking

---

## Proposed Architecture

### Design Principles
1. **Centralized Service**: Single source of truth for all analytics calculations
2. **Performance-First**: Efficient queries with proper indexing and caching
3. **Backward Compatible**: Existing systems continue to work unchanged
4. **Scalable**: Designed for growth with async processing where needed
5. **Real-Time Where Possible**: Cache with appropriate TTL for balance

### Service Layer Structure

```
lib/analytics/
├── index.ts                    # Main analytics service exports
├── student-analytics.ts        # Student-specific analytics
├── cohort-analytics.ts        # Cohort/admin analytics
├── progress-calculator.ts     # Core progress calculations
├── cache-manager.ts           # Caching layer
└── types.ts                   # TypeScript interfaces
```

### API Layer Structure

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

### Dashboard Structure

```
app/dashboard/analytics/
├── page.tsx                   # Student analytics dashboard
└── components/
    ├── ProgressOverview.tsx
    ├── AssignmentPerformance.tsx
    ├── QuizPerformance.tsx
    └── ActivityTimeline.tsx

app/admin/analytics/
├── page.tsx                   # Admin analytics dashboard
└── components/
    ├── CohortOverview.tsx
    ├── StudentList.tsx
    ├── EngagementMetrics.tsx
    └── PerformanceDistribution.tsx
```

---

## Database Schema Additions

### New Tables

#### 1. student_analytics_snapshot
Stores periodic snapshots of student progress for historical tracking and trend analysis.

```sql
CREATE TABLE student_analytics_snapshot (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  lessons_total INTEGER NOT NULL DEFAULT 0,
  lessons_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  assignments_total INTEGER NOT NULL DEFAULT 0,
  assignments_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  quizzes_total INTEGER NOT NULL DEFAULT 0,
  quizzes_average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  overall_progress DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, cohort_id, snapshot_date)
);

CREATE INDEX idx_analytics_snapshot_user_date ON student_analytics_snapshot(user_id, snapshot_date DESC);
CREATE INDEX idx_analytics_snapshot_cohort_date ON student_analytics_snapshot(cohort_id, snapshot_date DESC);
```

#### 2. login_activity
Tracks student login activity for engagement analytics.

```sql
CREATE TABLE login_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_duration_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_activity_user_time ON login_activity(user_id, login_time DESC);
CREATE INDEX idx_login_activity_cohort_time ON login_activity(cohort_id, login_time DESC);
```

### New Indexes on Existing Tables

```sql
-- lesson_progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_lesson_progress_updated_at ON lesson_progress(updated_at DESC);

-- submissions
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_score ON submissions(assignment_id, ai_score);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON submissions(user_id, status);

-- quiz_responses
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_score ON quiz_responses(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_cohort ON quiz_responses(quiz_id, cohort_id);

-- certificates
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);
```

---

## Core Analytics Calculations

### Student Progress Metrics

1. **Video Progress**
   - Lessons completed / total lessons
   - Average watch percentage
   - Time to completion per lesson

2. **Assignment Performance**
   - Assignments submitted / total assignments
   - Average assignment score
   - On-time submission rate
   - Revision rate (needs_revision status)

3. **Quiz Performance**
   - Quizzes taken / total quizzes
   - Average quiz score
   - Pass rate (score >= passing_score)
   - Best attempt per quiz

4. **Overall Progress**
   - Weighted combination of video, assignment, and quiz progress
   - Certificate eligibility status
   - Estimated completion date

### Cohort Analytics Metrics

1. **Engagement Metrics**
   - Active students (last 7 days)
   - Average session duration
   - Login frequency
   - Course completion rate

2. **Performance Distribution**
   - Score distribution histogram
   - Top performers
   - At-risk students (low progress)
   - Average time to completion

3. **Activity Trends**
   - Daily/weekly active users
   - Submission trends
   - Quiz participation trends

---

## Caching Strategy

### Cache Keys
- `student_progress:{user_id}:{cohort_id}` - Student progress overview (TTL: 5 min)
- `cohort_analytics:{cohort_id}` - Cohort-wide analytics (TTL: 10 min)
- `leaderboard:{cohort_id}` - Leaderboard (TTL: 5 min)
- `student_list:{cohort_id}` - Student list with metrics (TTL: 10 min)

### Cache Invalidation
- Invalidate on lesson progress update
- Invalidate on assignment submission
- Invalidate on quiz completion
- Invalidate on certificate issuance
- Manual invalidation available for admin

### Implementation
Use Next.js built-in cache with Redis fallback for production:
```typescript
// Development: Next.js cache
// Production: Redis with fallback to Next.js cache
```

---

## API Endpoints

### Student Endpoints

#### GET /api/analytics/student/progress
Returns comprehensive student progress overview.

**Response**:
```typescript
{
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
  }
  assignmentProgress: {
    submitted: number
    total: number
    percentage: number
    averageScore: number
    onTimeRate: number
  }
  quizProgress: {
    completed: number
    total: number
    averageScore: number
    passRate: number
  }
  certificate: {
    eligible: boolean
    issued: boolean
    issuedAt: string | null
  }
}
```

#### GET /api/analytics/student/assignments
Returns detailed assignment performance.

#### GET /api/analytics/student/quizzes
Returns detailed quiz performance.

#### GET /api/analytics/student/activity
Returns login/activity timeline.

### Admin Endpoints

#### GET /api/analytics/admin/cohort
Returns cohort-wide analytics.

#### GET /api/analytics/admin/students
Returns student list with progress metrics.

#### GET /api/analytics/admin/engagement
Returns engagement metrics.

#### GET /api/analytics/admin/performance
Returns performance distribution.

---

## Implementation Phases

### Phase 1: Core Service (Week 1)
- Create analytics service structure
- Implement progress calculator
- Add database schema (tables + indexes)
- Implement caching layer
- Create student progress API

### Phase 2: Student Dashboard (Week 2)
- Create student analytics dashboard
- Implement assignment performance view
- Implement quiz performance view
- Implement activity timeline
- Add login activity tracking

### Phase 3: Admin Dashboard (Week 3)
- Create admin analytics dashboard
- Implement cohort overview
- Implement student list with metrics
- Implement engagement metrics
- Implement performance distribution

### Phase 4: Advanced Features (Week 4)
- Historical snapshots with scheduled jobs
- Trend analysis
- Predictive analytics (at-risk identification)
- Export functionality
- Advanced filtering and sorting

---

## Backward Compatibility

### Existing Systems Unchanged
- `lib/progress-service.ts` continues to work as-is
- `app/api/progress/route.ts` continues to work as-is
- Existing dashboard pages continue to work as-is
- Leaderboard continues to work as-is

### Migration Path
- Analytics service reads from existing tables
- No data migration required
- New tables are additive only
- Existing indexes remain

### Deprecation Plan
- Old progress API remains for backward compatibility
- New analytics API is the recommended path forward
- Consider deprecating old API after 6 months

---

## Performance Considerations

### Query Optimization
- Use materialized views for complex aggregations
- Implement incremental updates for snapshots
- Use partial indexes for filtered queries
- Batch operations for bulk updates

### Caching Strategy
- Cache expensive calculations
- Use appropriate TTL values
- Implement cache warming for critical data
- Monitor cache hit rates

### Async Processing
- Snapshot creation via background jobs
- Login activity tracking via middleware
- Large cohort analytics via async processing

---

## Monitoring

### Key Metrics
- Analytics API response times
- Cache hit rates
- Database query performance
- Snapshot job execution time

### Alerts
- Slow query alerts (>1s)
- Cache miss rate alerts (>50%)
- API error rate alerts (>5%)
- Snapshot job failure alerts

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
