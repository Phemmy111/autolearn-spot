# Analytics Formulas Documentation

This document provides detailed formulas and calculations used throughout the Student Progress Analytics module.

---

## Video Progress Formulas

### Lessons Completed
```typescript
lessons_completed = COUNT(lesson_progress WHERE user_id = X AND cohort_id = Y AND completed = true)
```

### Lessons Total
```typescript
lessons_total = COUNT(lessons WHERE cohort_id = Y)
```

### Lessons Percentage
```typescript
lessons_percentage = ROUND((lessons_completed / lessons_total) * 100)
```

### Average Watch Percentage
```typescript
average_watch_pct = ROUND(
  SUM(watch_pct FROM lesson_progress WHERE user_id = X AND cohort_id = Y AND completed = true) / 
  COUNT(lesson_progress WHERE user_id = X AND cohort_id = Y AND completed = true)
)
```

### Last Activity (Video)
```typescript
last_activity_at = MAX(updated_at FROM lesson_progress WHERE user_id = X AND cohort_id = Y)
```

---

## Assignment Progress Formulas

### Assignments Submitted
```typescript
assignments_submitted = COUNT(submissions WHERE user_id = X AND assignment_id IN (
  SELECT id FROM assignments WHERE cohort_id = Y
))
```

### Assignments Total
```typescript
assignments_total = COUNT(assignments WHERE cohort_id = Y)
```

### Assignments Percentage
```typescript
assignments_percentage = ROUND((assignments_submitted / assignments_total) * 100)
```

### Average Assignment Score
```typescript
average_score = ROUND(
  SUM(ai_score FROM submissions WHERE user_id = X AND ai_score IS NOT NULL) / 
  COUNT(ai_score FROM submissions WHERE user_id = X AND ai_score IS NOT NULL)
)
```

### On-Time Submission Rate
```typescript
on_time_submissions = COUNT(submissions WHERE 
  user_id = X AND 
  created_at <= assignments.due_date OR assignments.due_date IS NULL
)

on_time_rate = ROUND((on_time_submissions / assignments_submitted) * 100)
```

### Status Counts
```typescript
pending_review = COUNT(submissions WHERE user_id = X AND status = 'submitted')
approved = COUNT(submissions WHERE user_id = X AND status = 'approved')
needs_revision = COUNT(submissions WHERE user_id = X AND status = 'needs_revision')
```

### Last Submission
```typescript
last_submission_at = MAX(created_at FROM submissions WHERE user_id = X)
```

---

## Quiz Progress Formulas

### Quizzes Completed (Unique)
```typescript
quizzes_completed = COUNT(DISTINCT quiz_id FROM quiz_responses WHERE user_id = X AND cohort_id = Y)
```

### Quizzes Total
```typescript
quizzes_total = COUNT(quizzes WHERE cohort_id = Y AND is_active = true)
```

### Quizzes Percentage
```typescript
quizzes_percentage = ROUND((quizzes_completed / quizzes_total) * 100)
```

### Average Quiz Score (Best Attempt Per Quiz)
```typescript
// Get best attempt per quiz
best_attempts = GROUP BY quiz_id, TAKE MAX(score)

average_score = ROUND(SUM(best_attempts.score) / COUNT(best_attempts))
```

### Pass Rate
```typescript
passing_score = quizzes.passing_score OR 70

quizzes_passed = COUNT(best_attempts WHERE score >= passing_score)

pass_rate = ROUND((quizzes_passed / quizzes_completed) * 100)
```

### Passed Count
```typescript
passed = COUNT(best_attempts WHERE score >= passing_score)
```

### Last Quiz
```typescript
last_quiz_at = MAX(created_at FROM quiz_responses WHERE user_id = X)
```

---

## Overall Progress Formulas

### Weighted Overall Progress
```typescript
video_weight = 0.4      // 40%
assignment_weight = 0.35 // 35%
quiz_weight = 0.25      // 25%

overall_percentage = ROUND(
  (video_progress.percentage * video_weight) +
  (assignment_progress.percentage * assignment_weight) +
  (quiz_progress.percentage * quiz_weight)
)
```

### Status Determination
```typescript
IF overall_percentage >= 100 THEN status = 'completed'
ELSE IF overall_percentage > 80 THEN status = 'ahead'
ELSE IF overall_percentage >= 50 THEN status = 'on_track'
ELSE status = 'behind'
```

### Estimated Completion Date
```typescript
// Simple linear projection (can be enhanced with historical data)
days_since_start = 30 // Placeholder - should use actual enrollment date

IF overall_percentage > 0 AND overall_percentage < 100 THEN
  days_remaining = ROUND((days_since_start / overall_percentage) * (100 - overall_percentage))
  estimated_completion_date = NOW() + days_remaining days
ELSE
  estimated_completion_date = NULL
END IF
```

---

## Certificate Eligibility Formulas

### Eligibility Criteria
```typescript
video_complete = (video_progress.percentage >= 100)
assignments_complete = (assignment_progress.approved == assignment_progress.total)
quizzes_complete = (quiz_progress.passed == quiz_progress.total)

eligible = video_complete AND assignments_complete AND quizzes_complete
```

### Issued Status
```typescript
issued = EXISTS(certificates WHERE user_id = X AND cohort_id = Y)
issued_at = certificates.issued_at (if exists)
```

---

## Engagement Metrics Formulas

### Active Students (7 Days)
```typescript
active_students_7d = COUNT(DISTINCT user_id FROM login_activity 
  WHERE cohort_id = Y 
  AND login_time >= NOW() - INTERVAL '7 days'
)
```

### Active Students (30 Days)
```typescript
active_students_30d = COUNT(DISTINCT user_id FROM login_activity 
  WHERE cohort_id = Y 
  AND login_time >= NOW() - INTERVAL '30 days'
)
```

### Average Session Duration
```typescript
average_session_duration = ROUND(
  AVG(session_duration_seconds FROM login_activity 
    WHERE cohort_id = Y 
    AND session_duration_seconds IS NOT NULL
    AND login_time >= NOW() - INTERVAL '30 days'
  )
)
```

### Average Login Frequency
```typescript
total_logins_30d = COUNT(login_activity 
  WHERE cohort_id = Y 
  AND login_time >= NOW() - INTERVAL '30 days'
)

average_login_frequency = ROUND(total_logins_30d / active_students_30d / 4)
// Result: logins per week per active user
```

### Course Completion Rate
```typescript
total_students = COUNT(enrollments WHERE cohort_id = Y AND status = 'active')
completed_students = COUNT(certificates WHERE cohort_id = Y)

completion_rate = ROUND((completed_students / total_students) * 100)
```

---

## Performance Distribution Formulas

### Score Ranges
```typescript
score_ranges = [
  { range: '90-100', count: COUNT(scores WHERE score >= 90 AND score <= 100) },
  { range: '80-89', count: COUNT(scores WHERE score >= 80 AND score <= 89) },
  { range: '70-79', count: COUNT(scores WHERE score >= 70 AND score <= 79) },
  { range: '60-69', count: COUNT(scores WHERE score >= 60 AND score <= 69) },
  { range: '50-59', count: COUNT(scores WHERE score >= 50 AND score <= 59) },
  { range: '0-49', count: COUNT(scores WHERE score >= 0 AND score <= 49) }
]

FOR EACH range:
  percentage = ROUND((range.count / total_students) * 100)
```

### Average Score
```typescript
average_score = ROUND(SUM(total_score FROM leaderboard WHERE cohort_id = Y) / total_students)
```

### Median Score
```typescript
sorted_scores = SORT(total_score FROM leaderboard WHERE cohort_id = Y ASC)
IF total_students % 2 == 0 THEN
  median_score = (sorted_scores[total_students/2 - 1] + sorted_scores[total_students/2]) / 2
ELSE
  median_score = sorted_scores[FLOOR(total_students/2)]
END IF
```

### Top Performers
```typescript
top_performers = TOP 10 FROM leaderboard 
  WHERE cohort_id = Y 
  ORDER BY total_score DESC
```

---

## At-Risk Student Formulas

### At-Risk Criteria
```typescript
// A student is at-risk if:
progress_percentage = ROUND((completed_lessons / total_lessons) * 100)

days_since_activity = FLOOR(
  (NOW() - last_activity.login_time) / (1000 * 60 * 60 * 24)
)

is_at_risk = (progress_percentage < 50) AND (days_since_activity > 7)
```

### Last Activity Calculation
```typescript
last_activity = SELECT login_time FROM login_activity 
  WHERE user_id = X 
  ORDER BY login_time DESC 
  LIMIT 1
```

---

## Cohort Average Progress Formula

```typescript
FOR EACH student IN enrollments WHERE cohort_id = Y AND status = 'active':
  user_progress = ROUND(
    (COUNT(completed_lessons WHERE user_id = student.user_id) / total_lessons) * 100
  )
  total_progress += user_progress

average_progress = ROUND(total_progress / total_students)
```

---

## Total Score Formula

```typescript
total_score = leaderboard.total_score (from existing leaderboard table)
// Note: Score calculation is handled by the existing leaderboard system
```

---

## Cache Invalidation Triggers

### When to Invalidate Student Progress Cache
```typescript
// Invalidate after:
1. Lesson progress update (upsertLessonProgress)
2. Assignment submission (POST /api/assignments/[id]/submissions)
3. Quiz completion (when quiz response is created)
4. Certificate issuance (POST /api/certificate/complete)
```

### When to Invalidate Cohort Analytics Cache
```typescript
// Invalidate after:
1. Any student progress update
2. Any assignment submission
3. Any quiz completion
4. Any certificate issuance
5. Manual admin trigger
```

---

## Rounding Precision

All percentage calculations use `ROUND()` to 0 decimal places for display:
- Progress percentages: 0 decimal places (e.g., 75%)
- Average scores: 0 decimal places (e.g., 85%)
- Pass rates: 0 decimal places (e.g., 70%)

Decimal values in database use `DECIMAL(5,2)` for storage precision:
- Allows values from -999.99 to 999.99
- 2 decimal places for intermediate calculations

---

## Edge Cases

### Division by Zero Protection
```typescript
IF denominator == 0 THEN
  result = 0
ELSE
  result = ROUND((numerator / denominator) * 100)
END IF
```

### Null Handling
```typescript
// Use NULLIF for safe division
percentage = ROUND((numerator / NULLIF(denominator, 0)) * 100)

// Use COALESCE for default values
average_score = ROUND(AVG(COALESCE(ai_score, 0)))
```

### Empty Result Sets
```typescript
// When no data exists, return defaults
IF result_set IS EMPTY THEN
  percentage = 0
  average_score = 0
  count = 0
END IF
```

---

## Performance Notes

### Index Usage
All queries use appropriate indexes:
- `idx_lesson_progress_cohort_user_completed` for user progress
- `idx_submissions_user_status` for submission status
- `idx_quiz_responses_user_score` for quiz performance
- `idx_login_activity_user_time` for activity timeline

### Query Optimization
- Use `COUNT(*)` with `WHERE` clauses instead of counting all records
- Use `DISTINCT` for unique counts
- Use `GROUP BY` for aggregations
- Use partial indexes with `WHERE` for filtered queries

### Caching Strategy
- Student progress: 5 minutes TTL
- Cohort analytics: 10 minutes TTL
- Activity timeline: 1 minute TTL
- Tag-based invalidation for selective cache clearing
