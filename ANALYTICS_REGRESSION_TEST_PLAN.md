# Analytics Regression Test Plan

## Overview
End-to-end regression testing to verify analytics update correctly after key user actions.

## Test Environment
- Database: PostgreSQL (Supabase)
- Test User: [To be created]
- Test Cohort: [To be created]

---

## Test Cases

### Test 1: Lesson Completion Analytics Update

**Pre-conditions:**
- User is enrolled in a cohort
- Cohort has at least 5 lessons
- User has completed 0 lessons

**Test Steps:**
1. Record initial analytics state:
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE completed = true) as completed_lessons,
     COUNT(*) as total_lessons
   FROM lesson_progress 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```
2. Call `/api/progress` to update lesson progress for lesson 1 as completed
3. Verify cache invalidation:
   - Check that `student_progress:{user_id}:{cohort_id}` cache is invalidated
4. Fetch analytics from `/api/analytics/student/progress`
5. Verify database state:
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE completed = true) as completed_lessons,
     COUNT(*) as total_lessons
   FROM lesson_progress 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```

**Expected Results:**
- `videoProgress.completed` increases by 1
- `videoProgress.percentage` increases by (1/total_lessons * 100)
- `overallProgress.percentage` increases by weighted calculation
- Cache is invalidated and new data is returned
- Database state matches API response

**Rollback:**
- Reset lesson progress to incomplete state

---

### Test 2: Assignment Submission Analytics Update

**Pre-conditions:**
- User is enrolled in a cohort
- Cohort has at least 3 assignments
- User has submitted 0 assignments

**Test Steps:**
1. Record initial analytics state:
   ```sql
   SELECT COUNT(*) as submitted_assignments
   FROM submissions 
   WHERE user_id = 'test_user';
   ```
2. Create an assignment submission via `/api/assignments/[id]/submissions`
3. Verify cache invalidation:
   - Check that `student_progress:{user_id}:{cohort_id}` cache is invalidated
   - Check that `cohort_analytics:{cohort_id}` cache is invalidated
4. Fetch analytics from `/api/analytics/student/progress`
5. Fetch assignment performance from `/api/analytics/student/assignments`
6. Verify database state:
   ```sql
   SELECT COUNT(*) as submitted_assignments
   FROM submissions 
   WHERE user_id = 'test_user';
   ```

**Expected Results:**
- `assignmentProgress.submitted` increases by 1
- `assignmentProgress.percentage` increases by (1/total_assignments * 100)
- `overallProgress.percentage` increases by weighted calculation
- Assignment appears in `/api/analytics/student/assignments` response
- Cache is invalidated and new data is returned
- Database state matches API response

**Rollback:**
- Delete the submission record

---

### Test 3: Quiz Completion Analytics Update

**Pre-conditions:**
- User is enrolled in a cohort
- Cohort has at least 3 quizzes
- User has completed 0 quizzes

**Test Steps:**
1. Record initial analytics state:
   ```sql
   SELECT COUNT(DISTINCT quiz_id) as completed_quizzes
   FROM quiz_responses 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```
2. Submit a quiz response (via existing quiz submission flow)
3. Verify cache invalidation:
   - Check that `student_progress:{user_id}:{cohort_id}` cache is invalidated
   - Check that `cohort_analytics:{cohort_id}` cache is invalidated
4. Fetch analytics from `/api/analytics/student/progress`
5. Fetch quiz performance from `/api/analytics/student/quizzes`
6. Verify database state:
   ```sql
   SELECT COUNT(DISTINCT quiz_id) as completed_quizzes, AVG(score) as avg_score
   FROM quiz_responses 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```

**Expected Results:**
- `quizProgress.completed` increases by 1
- `quizProgress.percentage` increases by (1/total_quizzes * 100)
- `quizProgress.averageScore` reflects the new quiz score
- `overallProgress.percentage` increases by weighted calculation
- Quiz appears in `/api/analytics/student/quizzes` response
- Cache is invalidated and new data is returned
- Database state matches API response

**Rollback:**
- Delete the quiz response record

---

### Test 4: Certificate Issuance Analytics Update

**Pre-conditions:**
- User has 100% video progress
- User has all assignments approved
- User has all quizzes passed
- User does not have a certificate

**Test Steps:**
1. Record initial analytics state:
   ```sql
   SELECT * FROM certificates 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```
2. Call `/api/certificate/complete` to issue certificate
3. Verify cache invalidation:
   - Check that `student_progress:{user_id}:{cohort_id}` cache is invalidated
   - Check that `cohort_analytics:{cohort_id}` cache is invalidated
4. Fetch analytics from `/api/analytics/student/progress`
5. Verify database state:
   ```sql
   SELECT * FROM certificates 
   WHERE user_id = 'test_user' AND cohort_id = 'test_cohort';
   ```

**Expected Results:**
- `certificate.eligible` is true
- `certificate.issued` is true
- `certificate.issuedAt` is set to current timestamp
- `overallProgress.status` is 'completed'
- Cache is invalidated and new data is returned
- Database state matches API response
- Certificate record exists in database

**Rollback:**
- Delete the certificate record

---

### Test 5: Login Activity Tracking

**Pre-conditions:**
- User is enrolled in a cohort
- User has no recent login activity

**Test Steps:**
1. Record initial login activity count:
   ```sql
   SELECT COUNT(*) as login_count
   FROM login_activity 
   WHERE user_id = 'test_user';
   ```
2. User signs in and navigates to dashboard
3. Verify login activity is recorded:
   ```sql
   SELECT * FROM login_activity 
   WHERE user_id = 'test_user' 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
4. Fetch activity from `/api/analytics/student/activity`

**Expected Results:**
- Login activity record is created in database
- `login_time` is set to current timestamp
- `user_id` matches the test user
- `cohort_id` is set (if user is enrolled)
- Activity appears in `/api/analytics/student/activity` response

**Rollback:**
- Delete the login activity record

---

### Test 6: Cache Invalidation Verification

**Pre-conditions:**
- User has existing analytics data
- Cache is populated

**Test Steps:**
1. Fetch analytics from `/api/analytics/student/progress` (warm cache)
2. Record response time (should be fast, <50ms)
3. Update lesson progress
4. Immediately fetch analytics again
5. Verify response time is slower (cold cache, >100ms)
6. Fetch analytics again (should be fast, warm cache)

**Expected Results:**
- First fetch: Fast (warm cache)
- After update: Slower (cache invalidated, cold cache)
- Second fetch: Fast (warm cache again)
- Data reflects the update after cache invalidation

---

### Test 7: Admin Dashboard Data Accuracy

**Pre-conditions:**
- Cohort has at least 5 enrolled students
- Students have varying progress levels

**Test Steps:**
1. For each student, record direct database values:
   ```sql
   SELECT 
     user_id,
     COUNT(*) FILTER (WHERE completed = true) as completed_lessons,
     COUNT(*) as total_lessons
   FROM lesson_progress 
   WHERE cohort_id = 'test_cohort'
   GROUP BY user_id;
   ```
2. Fetch admin analytics from `/api/analytics/admin/cohort`
3. Fetch student list from `/api/analytics/admin/students`
4. Compare API response with direct database queries

**Expected Results:**
- `totalStudents` matches enrollment count
- `averageProgress` matches calculated average from database
- Each student's `progressPercentage` matches their database calculation
- `activeStudents` matches count of students with recent activity
- Performance distribution matches leaderboard scores

---

### Test 8: At-Risk Student Identification

**Pre-conditions:**
- Cohort has students with varying progress
- Some students have been inactive for >7 days

**Test Steps:**
1. Identify at-risk students manually:
   ```sql
   SELECT 
     lp.user_id,
     COUNT(*) FILTER (WHERE lp.completed = true) as completed,
     COUNT(*) as total,
     la.login_time as last_activity
   FROM lesson_progress lp
   LEFT JOIN login_activity la ON la.user_id = lp.user_id
   WHERE lp.cohort_id = 'test_cohort'
   GROUP BY lp.user_id, la.login_time
   HAVING (COUNT(*) FILTER (WHERE lp.completed = true)::FLOAT / COUNT(*)) < 0.5
   AND (la.login_time IS NULL OR la.login_time < NOW() - INTERVAL '7 days');
   ```
2. Fetch admin analytics from `/api/analytics/admin/performance`
3. Compare `atRiskStudents` list with manual query

**Expected Results:**
- `atRiskStudents` list matches manual query results
- Each at-risk student has `progressPercentage` < 50%
- Each at-risk student has `lastActivity` > 7 days ago

---

## Test Execution Checklist

### Before Testing
- [ ] Create test user account
- [ ] Enroll test user in test cohort
- [ ] Create test lessons, assignments, quizzes
- [ ] Verify database schema is applied
- [ ] Verify indexes are created
- [ ] Clear all caches

### During Testing
- [ ] Execute Test 1: Lesson Completion
- [ ] Execute Test 2: Assignment Submission
- [ ] Execute Test 3: Quiz Completion
- [ ] Execute Test 4: Certificate Issuance
- [ ] Execute Test 5: Login Activity Tracking
- [ ] Execute Test 6: Cache Invalidation
- [ ] Execute Test 7: Admin Dashboard Accuracy
- [ ] Execute Test 8: At-Risk Identification

### After Testing
- [ ] Clean up test data
- [ ] Document any failures
- [ ] Verify rollback procedures work
- [ ] Update documentation if needed

---

## Test Data Cleanup SQL

```sql
-- Clean up test data
DELETE FROM lesson_progress WHERE user_id = 'test_user';
DELETE FROM submissions WHERE user_id = 'test_user';
DELETE FROM quiz_responses WHERE user_id = 'test_user';
DELETE FROM certificates WHERE user_id = 'test_user';
DELETE FROM login_activity WHERE user_id = 'test_user';
DELETE FROM enrollments WHERE clerk_user_id = 'test_user';
```

---

## Expected Test Results Summary

| Test Case | Expected Status | Notes |
|-----------|----------------|-------|
| Lesson Completion | ✅ Pass | Cache invalidation verified |
| Assignment Submission | ✅ Pass | Cache invalidation verified |
| Quiz Completion | ✅ Pass | Cache invalidation verified |
| Certificate Issuance | ✅ Pass | Cache invalidation verified |
| Login Activity Tracking | ✅ Pass | Activity recorded correctly |
| Cache Invalidation | ✅ Pass | Cache cleared on updates |
| Admin Dashboard Accuracy | ✅ Pass | Data matches database |
| At-Risk Identification | ✅ Pass | Criteria applied correctly |

---

## Failure Handling

If any test fails:
1. Document the failure with expected vs actual results
2. Check database logs for errors
3. Verify indexes are being used
4. Check cache configuration
5. Verify integration utilities are called
6. Roll back test data
7. Fix issue and re-test

---

## Sign-off

**Tester:** _______________
**Date:** _______________
**Status:** _______________
