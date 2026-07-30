# RC Testing Guide - Student Progress Analytics

## Overview
Step-by-step guide to execute regression tests for the Student Progress Analytics module.

## Prerequisites
- ✅ Database migration applied
- ✅ Application server running
- ✅ Test user account enrolled in a cohort
- ✅ Cohort has lessons, assignments, and quizzes

---

## Test 1: Lesson Completion Analytics Update

### Step 1: Record Initial State
Run this SQL query in your database:
```sql
SELECT 
  COUNT(*) FILTER (WHERE completed = true) as completed_lessons,
  COUNT(*) as total_lessons
FROM lesson_progress 
WHERE user_id = 'YOUR_USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```

### Step 2: Update Lesson Progress
Navigate to a lesson in the dashboard and mark it as complete (watch to 100% or use the progress API).

### Step 3: Fetch Analytics
Visit: `http://localhost:3000/dashboard/analytics`
Or call API: `GET /api/analytics/student/progress`

### Step 4: Verify Results
- Check that `videoProgress.completed` increased by 1
- Check that `videoProgress.percentage` increased
- Check that `overallProgress.percentage` increased

### Step 5: Verify Database
Run the SQL query again and confirm the count increased.

**Expected Result:** ✅ Pass if all values match

---

## Test 2: Assignment Submission Analytics Update

### Step 1: Record Initial State
```sql
SELECT COUNT(*) as submitted_assignments
FROM submissions 
WHERE user_id = 'YOUR_USER_ID';
```

### Step 2: Submit Assignment
Navigate to an assignment and submit it (provide URL, screenshot, or notes).

### Step 3: Fetch Analytics
Visit: `http://localhost:3000/dashboard/analytics`
Or call API: `GET /api/analytics/student/progress`
Also check: `GET /api/analytics/student/assignments`

### Step 4: Verify Results
- Check that `assignmentProgress.submitted` increased by 1
- Check that `assignmentProgress.percentage` increased
- Check that the new assignment appears in the assignments list

### Step 5: Verify Database
Run the SQL query again and confirm the count increased.

**Expected Result:** ✅ Pass if all values match

---

## Test 3: Quiz Completion Analytics Update

### Step 1: Record Initial State
```sql
SELECT COUNT(DISTINCT quiz_id) as completed_quizzes, AVG(score) as avg_score
FROM quiz_responses 
WHERE user_id = 'YOUR_USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```

### Step 2: Complete Quiz
Navigate to a quiz and submit answers.

### Step 3: Fetch Analytics
Visit: `http://localhost:3000/dashboard/analytics`
Or call API: `GET /api/analytics/student/progress`
Also check: `GET /api/analytics/student/quizzes`

### Step 4: Verify Results
- Check that `quizProgress.completed` increased by 1
- Check that `quizProgress.percentage` increased
- Check that `quizProgress.averageScore` reflects the new score
- Check that the quiz appears in the quizzes list

### Step 5: Verify Database
Run the SQL query again and confirm the count increased.

**Expected Result:** ✅ Pass if all values match

---

## Test 4: Certificate Issuance Analytics Update

### Step 1: Complete All Requirements
Ensure you have:
- 100% video progress
- All assignments approved
- All quizzes passed

### Step 2: Issue Certificate
Call: `POST /api/certificate/complete`
With body: `{ "courseSlug": "your-course", "lessonId": "final-lesson-id" }`

### Step 3: Fetch Analytics
Visit: `http://localhost:3000/dashboard/analytics`
Or call API: `GET /api/analytics/student/progress`

### Step 4: Verify Results
- Check that `certificate.eligible` is true
- Check that `certificate.issued` is true
- Check that `certificate.issuedAt` is set
- Check that `overallProgress.status` is 'completed'

### Step 5: Verify Database
```sql
SELECT * FROM certificates 
WHERE user_id = 'YOUR_USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```

**Expected Result:** ✅ Pass if certificate is issued

---

## Test 5: Login Activity Tracking

### Step 1: Record Initial State
```sql
SELECT COUNT(*) as login_count
FROM login_activity 
WHERE user_id = 'YOUR_USER_ID';
```

### Step 2: Sign In
Sign out, then sign in again and navigate to the dashboard.

### Step 3: Verify Database
```sql
SELECT * FROM login_activity 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY login_time DESC 
LIMIT 1;
```

### Step 4: Fetch Activity
Call: `GET /api/analytics/student/activity?limit=10`

### Step 5: Verify Results
- Check that a new login record was created
- Check that `login_time` is recent
- Check that the activity appears in the API response

**Expected Result:** ✅ Pass if login activity is tracked

---

## Test 6: Cache Invalidation Verification

### Step 1: Warm Cache
Visit: `http://localhost:3000/dashboard/analytics`
Note the response time (should be fast on subsequent visits).

### Step 2: Update Data
Complete a lesson or submit an assignment.

### Step 3: Fetch Again
Immediately visit: `http://localhost:3000/dashboard/analytics`

### Step 4: Verify Results
- Check that the data reflects the update
- Check that the response time is slightly slower (cache invalidated)

### Step 5: Fetch Again
Visit the dashboard one more time.

### Step 6: Verify Results
- Check that response time is fast again (cache warmed)

**Expected Result:** ✅ Pass if cache invalidation works

---

## Test 7: Admin Dashboard Accuracy

### Step 1: Get Cohort ID
```sql
SELECT id FROM cohorts WHERE is_current = true;
```

### Step 2: Verify Total Students
```sql
SELECT COUNT(*) as total_students
FROM enrollments
WHERE cohort_id = 'YOUR_COHORT_ID' AND status = 'active';
```
Compare with admin dashboard at: `http://localhost:3000/admin/analytics/progress`

### Step 3: Verify Average Progress
```sql
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
Compare with admin dashboard.

### Step 4: Verify Individual Student Progress
For a sample student:
```sql
SELECT 
  ROUND((COUNT(*) FILTER (WHERE completed = true)::FLOAT / 
         NULLIF(COUNT(*), 0)) * 100) as progress_percentage
FROM lesson_progress
WHERE user_id = 'SAMPLE_USER_ID' AND cohort_id = 'YOUR_COHORT_ID';
```
Compare with student list in admin dashboard.

**Expected Result:** ✅ Pass if all values match

---

## Test 8: Performance Validation

### Step 1: Test Student Progress Endpoint
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/analytics/student/progress
```
- First call (cold cache): Should be <500ms
- Second call (warm cache): Should be <50ms

### Step 2: Test Admin Cohort Endpoint
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/analytics/admin/cohort
```
- First call (cold cache): Should be <2000ms
- Second call (warm cache): Should be <100ms

### Step 3: Test Activity Endpoint
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/analytics/student/activity
```
- First call (cold cache): Should be <100ms
- Second call (warm cache): Should be <20ms

**Expected Result:** ✅ Pass if all response times meet benchmarks

---

## Test Results Log

Record your results here:

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Lesson Completion | ⬜ Pass / ❌ Fail | |
| Test 2: Assignment Submission | ⬜ Pass / ❌ Fail | |
| Test 3: Quiz Completion | ⬜ Pass / ❌ Fail | |
| Test 4: Certificate Issuance | ⬜ Pass / ❌ Fail | |
| Test 5: Login Activity Tracking | ⬜ Pass / ❌ Fail | |
| Test 6: Cache Invalidation | ⬜ Pass / ❌ Fail | |
| Test 7: Admin Dashboard Accuracy | ⬜ Pass / ❌ Fail | |
| Test 8: Performance Validation | ⬜ Pass / ❌ Fail | |

---

## Issue Reporting

If any test fails:
1. Document the expected vs actual result
2. Check browser console for errors
3. Check server logs for errors
4. Verify database indexes exist
5. Report the issue with details

---

## Sign-off

**Tester:** _______________
**Date:** _______________
**All Tests Passed:** _______________
**Notes:** _______________
