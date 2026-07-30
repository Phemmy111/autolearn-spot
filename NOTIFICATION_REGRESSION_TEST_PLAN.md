# Notification System Regression Test Plan

## Test Scope
This document outlines the regression testing plan for the notification system integration across all AutoLearn Spot workflows.

---

## Test Environment Setup

### Prerequisites
1. Database with updated schema (event_id column added to notifications table)
2. Supabase service role key configured
3. Email service (Resend) configured
4. Test user accounts with Clerk authentication
5. Admin account for testing admin workflows

### Database Migration
Run the updated schema:
```bash
psql -U postgres -d autolearn_spot -f notifications-schema.sql
```

Verify the migration:
```sql
-- Check event_id column exists
\d notifications

-- Check unique constraint exists
SELECT conname FROM pg_constraint WHERE conrelid = 'notifications'::regclass;

-- Check index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'notifications';
```

---

## Test Cases

### 1. Scholarship Application Submission

**Test ID**: NOTIF-001  
**Workflow**: Student submits scholarship application

**Steps**:
1. Navigate to scholarship application form
2. Fill in all required fields
3. Submit application
4. Verify notification is created in database
5. Verify notification appears in student's notification center
6. Verify email is sent separately (not via notification system)

**Expected Results**:
- ✅ One notification created with event_id: `scholarship_app_submitted_{application_id}`
- ✅ Notification title: "Application Received"
- ✅ Notification message includes reference number
- ✅ Notification category: "payment"
- ✅ Notification target_type: "student"
- ✅ Action URL: "/scholarship/status"
- ✅ No duplicate notification on resubmission

**Idempotency Test**:
- Submit the same application twice (simulate webhook retry)
- Verify only one notification exists in database
- Verify database unique constraint prevents duplicate event_id

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'scholarship_app_submitted_{application_id}';
-- Should return exactly 1 row
```

---

### 2. Scholarship Status Changes

**Test ID**: NOTIF-002  
**Workflow**: Admin updates scholarship application status

**Steps**:
1. Admin navigates to scholarship management page
2. Select an application and update status to "Under Review"
3. Verify notification is created for applicant
4. Repeat for each status: Shortlisted, Accepted, Waitlisted, Not Selected

**Expected Results**:
- ✅ One notification per status change
- ✅ event_id format: `scholarship_status_{application_id}_{status}`
- ✅ Customized message per status:
  - Under Review: "Application Under Review"
  - Shortlisted: "Application Shortlisted"
  - Accepted: "Application Accepted" (urgent priority)
  - Waitlisted: "Application Waitlisted"
  - Not Selected: "Application Not Selected"
- ✅ Priority changes based on status (urgent for Accepted)
- ✅ Action URL: "/scholarship/status"

**Idempotency Test**:
- Update the same application to the same status twice
- Verify only one notification exists for that status

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'scholarship_status_{app_id}_{status}';
-- Should return exactly 1 row
```

---

### 3. Payment Verification (Webhook)

**Test ID**: NOTIF-003  
**Workflow**: Paystack webhook verifies successful payment

**Steps**:
1. Use Paystack test environment to process a payment
2. Trigger the webhook with a successful payment event
3. Verify notification is created for the applicant
4. Simulate webhook retry (send same webhook twice)
5. Verify no duplicate notification

**Expected Results**:
- ✅ One notification created with event_id: `payment_verified_{reference}`
- ✅ Notification title: "Payment Verified"
- ✅ Notification category: "payment"
- ✅ Priority: "urgent"
- ✅ Action URL: "/dashboard"
- ✅ Welcome email sent separately (not via notification system)

**Idempotency Test**:
- Send the same webhook payload twice
- Verify only one notification exists in database
- Verify database unique constraint prevents duplicate event_id

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'payment_verified_{reference}';
-- Should return exactly 1 row
```

---

### 4. Assignment Creation

**Test ID**: NOTIF-004  
**Workflow**: Admin creates a new assignment

**Steps**:
1. Admin navigates to assignment management
2. Create a new assignment with title, week number, cohort
3. Verify notification is created for the cohort
4. Verify email is sent to all cohort members

**Expected Results**:
- ✅ One notification created with event_id: `assignment_created_{assignment_id}`
- ✅ Notification title: "New Assignment Available"
- ✅ Notification message includes week number and title
- ✅ Notification category: "assignment"
- ✅ Target type: "cohort"
- ✅ Target ID: cohort_id
- ✅ Action URL: "/dashboard/assignments"
- ✅ send_email: true

**Idempotency Test**:
- Create the same assignment twice (simulate retry)
- Verify only one notification exists

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'assignment_created_{assignment_id}';
-- Should return exactly 1 row
```

---

### 5. Assignment Submission

**Test ID**: NOTIF-005  
**Workflow**: Student submits an assignment

**Steps**:
1. Student navigates to assignment page
2. Submit an assignment with content
3. Verify notification is created for the student
4. Update the same assignment (resubmit)
5. Verify no duplicate notification for the same submission

**Expected Results**:
- ✅ One notification per submission with event_id: `assignment_submission_{submission_id}`
- ✅ Notification title: "Assignment Submitted"
- ✅ Notification message includes week number and title
- ✅ Notification category: "assignment"
- ✅ Target type: "student"
- ✅ Action URL: "/dashboard/assignments"
- ✅ send_email: false (in-app only)

**Idempotency Test**:
- Submit the same assignment twice (simulate retry)
- Verify only one notification exists for that submission

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'assignment_submission_{submission_id}';
-- Should return exactly 1 row
```

---

### 6. Assignment Grading

**Test ID**: NOTIF-006  
**Workflow**: Admin grades a student's assignment

**Steps**:
1. Admin navigates to submission management
2. Select a submission and add score and feedback
3. Verify notification is created for the student
4. Update the same grade (simulate retry)
5. Verify no duplicate notification

**Expected Results**:
- ✅ One notification with event_id: `assignment_graded_{submission_id}`
- ✅ Notification title: "Assignment Graded"
- ✅ Notification message includes score
- ✅ Notification category: "assignment_review"
- ✅ Action URL: "/dashboard/assignments"
- ✅ send_email: true

**Idempotency Test**:
- Grade the same submission twice
- Verify only one notification exists

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'assignment_graded_{submission_id}';
-- Should return exactly 1 row
```

---

### 7. Quiz Creation

**Test ID**: NOTIF-007  
**Workflow**: Admin creates a new quiz

**Steps**:
1. Admin navigates to quiz management
2. Create a new quiz with title, week number, phase
3. Verify notification is created for all students
4. Verify email is sent to all active students

**Expected Results**:
- ✅ One notification with event_id: `quiz_created_{quiz_id}`
- ✅ Notification title: "New Quiz Available"
- ✅ Notification message includes week number and title
- ✅ Notification category: "quiz"
- ✅ Target type: "all"
- ✅ Action URL: "/quizzes"
- ✅ send_email: true

**Idempotency Test**:
- Create the same quiz twice (simulate retry)
- Verify only one notification exists

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'quiz_created_{quiz_id}';
-- Should return exactly 1 row
```

---

### 8. Certificate Issuance

**Test ID**: NOTIF-008  
**Workflow**: Student completes course and earns certificate

**Steps**:
1. Student completes all lessons and final lesson
2. Trigger certificate completion API
3. Verify notification is created for the student
4. Trigger certificate completion again (simulate retry)
5. Verify no duplicate notification

**Expected Results**:
- ✅ One notification with event_id: `certificate_issued_{user_id}_{cohort_id}`
- ✅ Notification title: "Certificate Earned"
- ✅ Notification message: Congratulations message
- ✅ Notification category: "certificate"
- ✅ Priority: "important"
- ✅ Action URL: "/certificate/download"
- ✅ send_email: true

**Idempotency Test**:
- Complete the certificate process twice
- Verify only one notification exists for that user/cohort combination

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'certificate_issued_{user_id}_{cohort_id}';
-- Should return exactly 1 row
```

---

### 9. Manual Enrollment

**Test ID**: NOTIF-009  
**Workflow**: Admin manually enrolls a student

**Steps**:
1. Admin navigates to enrollment management
2. Create a manual enrollment with email and cohort
3. Verify notification is created for the student
4. Create the same enrollment again (simulate retry)
5. Verify no duplicate notification

**Expected Results**:
- ✅ One notification with event_id: `enrollment_{email}_{cohort_id}`
- ✅ Notification title: "Welcome to AutoLearn Spot!"
- ✅ Notification message: Manual enrollment message
- ✅ Notification category: "enrollment"
- ✅ Priority: "important"
- ✅ Action URL: "/dashboard"
- ✅ send_email: true

**Idempotency Test**:
- Enroll the same student to the same cohort twice
- Verify only one notification exists

**Database Query**:
```sql
SELECT * FROM notifications WHERE event_id = 'enrollment_{email}_{cohort_id}';
-- Should return exactly 1 row
```

---

### 10. Live Class Scheduling

**Test ID**: NOTIF-010  
**Workflow**: Admin updates live class schedule

**Steps**:
1. Admin navigates to live class schedule management
2. Update the schedule with new class dates
3. Verify notification is created for all students
4. Update the schedule again immediately
5. Verify new notification is created (different event_id due to timestamp)

**Expected Results**:
- ✅ One notification per schedule update with event_id: `live_schedule_update_{timestamp}`
- ✅ Notification title: "Live Class Schedule Updated"
- ✅ Notification message includes next class details
- ✅ Notification category: "live_class"
- ✅ Priority: "important"
- ✅ Target type: "all"
- ✅ Action URL: "/live-class"
- ✅ send_email: true

**Note**: Live schedule notifications use timestamp in event_id, so each update creates a new notification. This is intentional to notify users of each schedule change.

---

## Cross-Workflow Tests

### Test: Notification Failure Does Not Block Primary Workflow

**Test ID**: NOTIF-011

**Steps**:
1. Temporarily break the notification service (e.g., invalid database credentials)
2. Submit a scholarship application
3. Verify the application is created successfully
4. Verify notification creation fails gracefully
5. Verify user can still proceed with the workflow

**Expected Results**:
- ✅ Primary workflow completes successfully
- ✅ Error is logged to console
- ✅ No exception propagates to user
- ✅ User receives success message for primary action

---

### Test: Bulk Notification Performance

**Test ID**: NOTIF-012

**Steps**:
1. Create a cohort with 100 test students
2. Create an assignment targeting that cohort
3. Measure time to create notification
4. Verify all students receive notification deliveries

**Expected Results**:
- ✅ Notification creation completes within 5 seconds
- ✅ All 100 notification_deliveries records created
- ✅ No timeout errors
- ✅ Email queue processes all emails (if async) or completes within reasonable time

---

## Database Verification Tests

### Test: Unique Constraint on event_id

**Test ID**: NOTIF-013

**Steps**:
1. Attempt to insert two notifications with the same event_id
2. Verify database rejects the second insert
3. Verify error is caught and handled gracefully

**SQL Test**:
```sql
-- First insert
INSERT INTO notifications (event_id, title, message, category, priority, target_type, created_at)
VALUES ('test_event_123', 'Test', 'Test message', 'system', 'normal', 'all', now());

-- Second insert (should fail)
INSERT INTO notifications (event_id, title, message, category, priority, target_type, created_at)
VALUES ('test_event_123', 'Test', 'Test message', 'system', 'normal', 'all', now());
-- Expected: duplicate key violation error
```

**Expected Results**:
- ✅ First insert succeeds
- ✅ Second insert fails with unique constraint violation
- ✅ Application handles the error gracefully

---

### Test: Index Performance

**Test ID**: NOTIF-014

**Steps**:
1. Create 10,000 test notifications
2. Query by event_id
3. Measure query performance

**SQL Test**:
```sql
EXPLAIN ANALYZE SELECT * FROM notifications WHERE event_id = 'test_event_123';
```

**Expected Results**:
- ✅ Query uses index (Index Scan)
- ✅ Query completes within 10ms
- ✅ No sequential scan

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Database schema updated with event_id column
- [ ] Unique constraint added to event_id
- [ ] Index created on event_id
- [ ] Test environment configured
- [ ] Test users created

### Test Execution
- [ ] NOTIF-001: Scholarship application submission
- [ ] NOTIF-002: Scholarship status changes
- [ ] NOTIF-003: Payment verification webhook
- [ ] NOTIF-004: Assignment creation
- [ ] NOTIF-005: Assignment submission
- [ ] NOTIF-006: Assignment grading
- [ ] NOTIF-007: Quiz creation
- [ ] NOTIF-008: Certificate issuance
- [ ] NOTIF-009: Manual enrollment
- [ ] NOTIF-010: Live class scheduling
- [ ] NOTIF-011: Notification failure handling
- [ ] NOTIF-012: Bulk notification performance
- [ ] NOTIF-013: Database unique constraint
- [ ] NOTIF-014: Index performance

### Post-Test Verification
- [ ] All tests pass
- [ ] No duplicate notifications found
- [ ] All event IDs follow deterministic format
- [ ] Database constraints working correctly
- [ ] Performance within acceptable limits
- [ ] Error handling verified

---

## Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| NOTIF-001 | Scholarship Application Submission | ☐ Pass / ☐ Fail | |
| NOTIF-002 | Scholarship Status Changes | ☐ Pass / ☐ Fail | |
| NOTIF-003 | Payment Verification Webhook | ☐ Pass / ☐ Fail | |
| NOTIF-004 | Assignment Creation | ☐ Pass / ☐ Fail | |
| NOTIF-005 | Assignment Submission | ☐ Pass / ☐ Fail | |
| NOTIF-006 | Assignment Grading | ☐ Pass / ☐ Fail | |
| NOTIF-007 | Quiz Creation | ☐ Pass / ☐ Fail | |
| NOTIF-008 | Certificate Issuance | ☐ Pass / ☐ Fail | |
| NOTIF-009 | Manual Enrollment | ☐ Pass / ☐ Fail | |
| NOTIF-010 | Live Class Scheduling | ☐ Pass / ☐ Fail | |
| NOTIF-011 | Notification Failure Handling | ☐ Pass / ☐ Fail | |
| NOTIF-012 | Bulk Notification Performance | ☐ Pass / ☐ Fail | |
| NOTIF-013 | Database Unique Constraint | ☐ Pass / ☐ Fail | |
| NOTIF-014 | Index Performance | ☐ Pass / ☐ Fail | |

---

## Known Limitations

1. **Live Schedule Notifications**: Use timestamp-based event_id, so each schedule update creates a new notification. This is intentional but may be noisy if schedule is updated frequently.

2. **Email Delivery**: Currently synchronous. For bulk notifications to large cohorts, this may add latency. See NOTIFICATION_ASYNC_ARCHITECTURE.md for recommended future improvements.

3. **Web Push**: Not tested in this plan as it requires browser subscription setup. Should be tested separately with actual browser subscriptions.

---

## Sign-Off

**Tester**: __________________  
**Date**: __________________  
**Environment**: __________________  
**Overall Status**: ☐ Pass / ☐ Fail  
**Notes**: __________________
