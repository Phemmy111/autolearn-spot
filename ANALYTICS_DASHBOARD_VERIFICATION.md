# Admin Dashboard Verification Guide

## Overview
Verification steps to confirm admin dashboards match underlying database values for sample students.

---

## Verification Queries

### 1. Cohort Overview Verification

**Dashboard Metric:** Total Students
```sql
-- Database Query
SELECT COUNT(*) as total_students
FROM enrollments
WHERE cohort_id = 'YOUR_COHORT_ID' AND status = 'active';
```

**Dashboard Metric:** Active Students (7 days)
```sql
-- Database Query
SELECT COUNT(DISTINCT user_id) as active_students_7d
FROM login_activity
WHERE cohort_id = 'YOUR_COHORT_ID'
AND login_time >= NOW() - INTERVAL '7 days';
```

**Dashboard Metric:** Average Progress
```sql
-- Database Query
WITH student_progress AS (
  SELECT 
    lp.user_id,
    COUNT(*) FILTER (WHERE lp.completed = true) as completed,
    COUNT(*) as total
  FROM lesson_progress lp
  WHERE lp.cohort_id = 'YOUR_COHORT_ID'
  GROUP BY lp.user_id
)
SELECT ROUND(AVG((completed::FLOAT / NULLIF(total, 0)) * 100)) as average_progress
FROM student_progress;
```

**Dashboard Metric:** Completion Rate
```sql
-- Database Query
SELECT 
  (COUNT(DISTINCT c.user_id)::FLOAT / 
   NULLIF((SELECT COUNT(*) FROM enrollments WHERE cohort_id = 'YOUR_COHORT_ID' AND status = 'active'), 0)) * 100 as completion_rate
FROM certificates c
WHERE c.cohort_id = 'YOUR_COHORT_ID';
```

---

### 2. Student List Verification

**For each student in the dashboard, verify:**

**Dashboard Metric:** Progress Percentage
```sql
-- Database Query (replace USER_ID)
SELECT 
  ROUND((COUNT(*) FILTER (WHERE completed = true)::FLOAT / 
         NULLIF(COUNT(*), 0)) * 100) as progress_percentage
FROM lesson_progress
WHERE user_id = 'USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```

**Dashboard Metric:** Total Score
```sql
-- Database Query (replace USER_ID)
SELECT total_score
FROM leaderboard
WHERE user_id = 'USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```

**Dashboard Metric:** Last Activity
```sql
-- Database Query (replace USER_ID)
SELECT MAX(login_time) as last_activity
FROM login_activity
WHERE user_id = 'USER_ID';
```

**Dashboard Metric:** Status
```sql
-- Database Query (replace USER_ID)
WITH last_activity AS (
  SELECT MAX(login_time) as last_login
  FROM login_activity
  WHERE user_id = 'USER_ID'
),
progress AS (
  SELECT 
    ROUND((COUNT(*) FILTER (WHERE completed = true)::FLOAT / 
           NULLIF(COUNT(*), 0)) * 100) as progress_pct
  FROM lesson_progress
  WHERE user_id = 'USER_ID' AND cohort_id = 'YOUR_COHORT_ID'
)
SELECT 
  CASE 
    WHEN p.progress_pct >= 100 THEN 'completed'
    WHEN la.last_login IS NULL OR la.last_login < NOW() - INTERVAL '14 days' THEN 'inactive'
    ELSE 'active'
  END as status
FROM progress p
CROSS JOIN last_activity la;
```

---

### 3. Performance Distribution Verification

**Dashboard Metric:** Score Ranges
```sql
-- Database Query
WITH score_ranges AS (
  SELECT 
    total_score,
    CASE 
      WHEN total_score >= 90 THEN '90-100'
      WHEN total_score >= 80 THEN '80-89'
      WHEN total_score >= 70 THEN '70-79'
      WHEN total_score >= 60 THEN '60-69'
      WHEN total_score >= 50 THEN '50-59'
      ELSE '0-49'
    END as range
  FROM leaderboard
  WHERE cohort_id = 'YOUR_COHORT_ID'
)
SELECT 
  range,
  COUNT(*) as count,
  ROUND((COUNT(*)::FLOAT / (SELECT COUNT(*) FROM leaderboard WHERE cohort_id = 'YOUR_COHORT_ID')) * 100) as percentage
FROM score_ranges
GROUP BY range
ORDER BY range DESC;
```

**Dashboard Metric:** Average Score
```sql
-- Database Query
SELECT ROUND(AVG(total_score)) as average_score
FROM leaderboard
WHERE cohort_id = 'YOUR_COHORT_ID';
```

**Dashboard Metric:** Median Score
```sql
-- Database Query
SELECT 
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_score) as median_score
FROM leaderboard
WHERE cohort_id = 'YOUR_COHORT_ID';
```

**Dashboard Metric:** Top Performers
```sql
-- Database Query
SELECT user_id, user_name, total_score
FROM leaderboard
WHERE cohort_id = 'YOUR_COHORT_ID'
ORDER BY total_score DESC
LIMIT 10;
```

---

### 4. At-Risk Students Verification

**Dashboard Metric:** At-Risk Students List
```sql
-- Database Query
WITH student_progress AS (
  SELECT 
    lp.user_id,
    e.email as user_name,
    COUNT(*) FILTER (WHERE lp.completed = true) as completed,
    COUNT(*) as total,
    la.login_time as last_activity
  FROM lesson_progress lp
  JOIN enrollments e ON e.clerk_user_id = lp.user_id OR e.email = lp.user_id
  LEFT JOIN login_activity la ON la.user_id = lp.user_id
  WHERE lp.cohort_id = 'YOUR_COHORT_ID' AND e.status = 'active'
  GROUP BY lp.user_id, e.email, la.login_time
)
SELECT 
  user_id,
  user_name,
  ROUND((completed::FLOAT / NULLIF(total, 0)) * 100) as progress_percentage,
  COALESCE(last_activity::TEXT, 'Never') as last_activity
FROM student_progress
WHERE (completed::FLOAT / NULLIF(total, 0)) < 0.5
AND (last_activity IS NULL OR last_activity < NOW() - INTERVAL '7 days')
ORDER BY progress_percentage ASC;
```

---

### 5. Engagement Metrics Verification

**Dashboard Metric:** Active Students (7 days)
```sql
-- Database Query
SELECT COUNT(DISTINCT user_id) as active_students_7d
FROM login_activity
WHERE cohort_id = 'YOUR_COHORT_ID'
AND login_time >= NOW() - INTERVAL '7 days';
```

**Dashboard Metric:** Active Students (30 days)
```sql
-- Database Query
SELECT COUNT(DISTINCT user_id) as active_students_30d
FROM login_activity
WHERE cohort_id = 'YOUR_COHORT_ID'
AND login_time >= NOW() - INTERVAL '30 days';
```

**Dashboard Metric:** Average Session Duration
```sql
-- Database Query
SELECT ROUND(AVG(session_duration_seconds)) as avg_session_duration
FROM login_activity
WHERE cohort_id = 'YOUR_COHORT_ID'
AND session_duration_seconds IS NOT NULL
AND login_time >= NOW() - INTERVAL '30 days';
```

**Dashboard Metric:** Average Login Frequency
```sql
-- Database Query
WITH stats AS (
  SELECT 
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_logins
  FROM login_activity
  WHERE cohort_id = 'YOUR_COHORT_ID'
  AND login_time >= NOW() - INTERVAL '30 days'
)
SELECT ROUND(total_logins::FLOAT / NULLIF(active_users, 0) / 4) as avg_login_frequency_per_week
FROM stats;
```

---

## Verification Procedure

### Step 1: Prepare Test Data
```sql
-- Replace with your test cohort ID
SET @cohort_id = 'YOUR_COHORT_ID';

-- Get sample students
SELECT clerk_user_id, email
FROM enrollments
WHERE cohort_id = @cohort_id AND status = 'active'
LIMIT 5;
```

### Step 2: Run Verification Queries
For each dashboard metric:
1. Run the corresponding SQL query
2. Compare result with dashboard display
3. Record any discrepancies

### Step 3: Document Results
Create a verification log:

| Metric | Dashboard Value | Database Value | Match? | Notes |
|--------|------------------|----------------|--------|-------|
| Total Students | 50 | 50 | ✅ | |
| Active Students (7d) | 35 | 35 | ✅ | |
| Average Progress | 65% | 65% | ✅ | |
| Completion Rate | 40% | 40% | ✅ | |
| Student 1 Progress | 75% | 75% | ✅ | |
| Student 1 Score | 850 | 850 | ✅ | |
| ... | ... | ... | ... | |

### Step 4: Investigate Discrepancies
If discrepancies found:
1. Check cache - clear and reload
2. Verify indexes are being used
3. Check for data inconsistencies
4. Review calculation formulas
5. Check for timezone issues

---

## Common Discrepancy Causes

### 1. Cache Staleness
**Symptom:** Dashboard shows old data
**Solution:** Clear cache and reload
```typescript
// In development, restart server
// In production, wait for TTL or use revalidateTag
```

### 2. Timezone Issues
**Symptom:** Activity times don't match
**Solution:** Ensure all timestamps use UTC
```sql
-- Check timezone
SHOW timezone;
-- Set to UTC if needed
SET timezone = 'UTC';
```

### 3. Index Not Used
**Symptom:** Slow queries, incorrect results
**Solution:** Run EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT * FROM lesson_progress WHERE user_id = 'test';
```

### 4. Data Inconsistency
**Symptom:** Counts don't match
**Solution:** Check for orphaned records
```sql
-- Check for lesson_progress without lessons
SELECT lp.* FROM lesson_progress lp
LEFT JOIN lessons l ON l.id = lp.lesson_id AND l.cohort_id = lp.cohort_id
WHERE l.id IS NULL;
```

### 5. Calculation Rounding
**Symptom:** Small percentage differences
**Solution:** Verify rounding is consistent
```typescript
// All percentages should use ROUND()
percentage = ROUND((numerator / denominator) * 100)
```

---

## Automated Verification Script

```typescript
// scripts/verify-dashboard.ts
import { supabaseAdmin } from '@/lib/supabase'

const cohortId = 'YOUR_COHORT_ID'

async function verifyDashboard() {
  const results = {
    totalStudents: { dashboard: 0, database: 0, match: false },
    averageProgress: { dashboard: 0, database: 0, match: false },
    // ... other metrics
  }

  // Get dashboard data
  const dashboardResponse = await fetch(`/api/analytics/admin/cohort?cohortId=${cohortId}`)
  const dashboardData = await dashboardResponse.json()

  // Get database data
  const { count: totalStudents } = await supabaseAdmin
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  // Compare
  results.totalStudents.dashboard = dashboardData.analytics.totalStudents
  results.totalStudents.database = totalStudents || 0
  results.totalStudents.match = results.totalStudents.dashboard === results.totalStudents.database

  // ... repeat for other metrics

  console.table(results)
  return results
}

verifyDashboard()
```

---

## Sign-off

**Verifier:** _______________
**Date:** _______________
**Cohort ID:** _______________
**All Metrics Match:** _______________
**Notes:** _______________
