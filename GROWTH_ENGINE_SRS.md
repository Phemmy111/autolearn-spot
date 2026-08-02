# AutoLearn Spot Growth Engine
## Software Requirements Specification (SRS)

**Document Version:** 1.0  
**Date:** August 1, 2026  
**Status:** Design Phase - Production Ready Specification  
**Confidentiality:** Internal - AutoLearn Spot

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Architecture](#architecture)
6. [Data Model](#data-model)
7. [User Flows](#user-flows)
8. [Security](#security)
9. [Testing](#testing)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Risks](#risks)
12. [Future Expansion](#future-expansion)

---

## Executive Summary

### Purpose
The AutoLearn Spot Growth Engine is a comprehensive referral and ambassador program designed to drive student acquisition through incentivized word-of-mouth marketing. The system integrates seamlessly with existing AutoLearn Spot infrastructure including payment processing, enrollment management, notifications, and analytics.

### Scope
The Growth Engine encompasses:
- Student referral program with ₦1,000 commission
- Campus Ambassador program with ₦1,000 commission
- Partner Ambassador program with ₦2,000 commission
- Commission tracking and management
- Withdrawal processing and payment
- Ambassador application and approval workflows
- Fraud prevention and security measures
- Analytics and reporting
- Multi-channel notifications

### Key Principles
- **No Duplicate Logic:** Reuse existing services wherever possible
- **Clean Integration:** Extend existing tables, don't duplicate functionality
- **Production Ready:** Scalable, maintainable, secure
- **Idempotent Operations:** Safe for retries and webhooks
- **Audit Trail:** Complete tracking of all growth-related activities

---

## Business Requirements

### Business Model

#### Course Pricing
- **Actual Course Value:** ₦8,000
- **Promotional Cohort Price:** ₦5,000
- **Fixed Price:** Every student pays exactly ₦5,000
- **No Referral Discounts:** Referrals do not reduce student payment amount

#### Commission Structure

| Referrer Type | Commission | Approval Method |
|--------------|------------|-----------------|
| Student Referrer | ₦1,000 | Automatic (upon successful payment) |
| Campus Ambassador | ₦1,000 | Admin Application Approval |
| Partner Ambassador | ₦2,000 | Admin Invitation |

### Business Rules

#### Referral Rules

1. **Referral Code Generation**
   - Each referrer receives a unique referral code
   - Format: 8-character alphanumeric, case-insensitive
   - Example: `ABC12XYZ`
   - Codes are permanent and reusable
   - No expiration on referral codes

2. **Referral Attribution**
   - First referral code used during registration/checkout is attributed
   - Attribution is locked after successful payment
   - Cannot change referral code after payment
   - Self-referral is prohibited (same email/clerk_user_id)

3. **Referral Limits**
   - No limit on number of referrals per referrer
   - No limit on commission earnings
   - One commission per successful referred enrollment

4. **Referral Tracking**
   - Track referral clicks (UTM parameters, referral code usage)
   - Track conversion rates (code usage → successful payment)
   - Track time-to-conversion (code usage → payment)

#### Commission Rules

1. **Commission Creation Trigger**
   - Commission is NEVER created after registration
   - Commission is NEVER created after application
   - Commission is ONLY created after:
     - Student registration with referral code
     - Successful payment (₦5,000)
     - Paystack verification webhook confirmation
     - Enrollment status = 'active'

2. **Commission Calculation**
   - Student Referrer: ₦1,000 per successful referral
   - Campus Ambassador: ₦1,000 per successful referral
   - Partner Ambassador: ₦2,000 per successful referral
   - Commission is calculated at payment time, not registration

3. **Commission Status**
   - Pending: Created but not yet withdrawable
   - Available: Ready for withdrawal (after 7-day holding period)
   - Withdrawing: Withdrawal request submitted
   - Paid: Successfully paid to referrer
   - Reversed: Commission reversed due to fraud/payment reversal

4. **Commission Holding Period**
   - 7-day holding period after commission creation
   - Protects against payment reversals/refunds
   - Commission becomes withdrawable after holding period
   - Holding period starts at payment verification time

5. **Commission Reversal**
   - Reverse commission if referred student's payment is reversed
   - Reverse commission if referred student's enrollment is cancelled
   - Reverse commission if fraud is detected
   - Automatic reversal via Paystack webhook (chargeback events)

#### Payment Rules

1. **Payment Integration**
   - Use existing Paystack integration
   - Extend existing payment webhook handler
   - Leverage existing payment_events table
   - No changes to payment flow for students

2. **Payment Verification**
   - Commission creation requires successful Paystack verification
   - Use existing payment verification logic
   - Commission creation is idempotent (safe for webhook retries)
   - Log all commission-related payment events

3. **Payment Amount**
   - Fixed ₦5,000 for all students
   - No discounts for referrals
   - Commission paid from AutoLearn Spot revenue
   - Commission does not affect student payment

#### Withdrawal Rules

1. **Withdrawal Eligibility**
   - Minimum withdrawal amount: ₦2,000
   - Must have at least one commission in "Available" status
   - All available commissions must be past 7-day holding period
   - Ambassador must be in "Active" status

2. **Withdrawal Processing**
   - Student submits withdrawal request
   - Admin reviews and approves/rejects
   - Admin processes payment manually
   - Admin marks withdrawal as "Paid"

3. **Withdrawal Status Flow**
   - Pending: Student submitted request
   - Approved: Admin approved request
   - Paid: Admin processed payment
   - Rejected: Admin rejected request (funds returned to available balance)

4. **Withdrawal Limits**
   - No limit on withdrawal frequency
   - No limit on withdrawal amount (above minimum)
   - Partial withdrawals allowed (select specific commissions)

5. **Withdrawal Methods**
   - Bank transfer (default)
   - Future: Paystack Transfer, Wallet
   - Admin collects bank details during approval

#### Promotion Rules

1. **Ambassador Promotion Criteria**
   - Student Referrer → Campus Ambassador:
     - 10+ successful referrals
     - 6+ months as active referrer
     - Clean fraud record
     - Admin approval required

   - Campus Ambassador → Partner Ambassador:
     - 50+ successful referrals
     - 12+ months as active ambassador
     - High conversion rate (>30%)
     - Strong engagement metrics
     - Admin approval required

2. **Demotion Criteria**
   - Fraud activity
   - Suspended status for 30+ days
   - Inactivity for 90+ days
   - Admin decision

3. **Status Changes**
   - All status changes require admin approval
   - Status changes are logged in audit trail
   - Notifications sent on status changes

#### Fraud Rules

1. **Self-Referral Detection**
   - Block same email/clerk_user_id as referrer
   - Block same IP address within 24 hours
   - Block same device fingerprint
   - Manual review for suspicious patterns

2. **Duplicate Referral Prevention**
   - One commission per enrollment
   - Cannot change referral code after payment
   - Unique commission per payment reference
   - Idempotent commission creation

3. **Fake Payment Detection**
   - Require Paystack verification
   - Cross-reference payment amount (must be ₦5,000)
   - Block test mode payments
   - Monitor for rapid payment patterns

4. **Multiple Account Detection**
   - Monitor for same IP/bank details
   - Monitor for similar user patterns
   - Manual review for suspicious activity
   - Account linking for legitimate cases

5. **Commission Abuse Prevention**
   - 7-day holding period
   - Automatic reversal on payment reversal
   - Manual review for high-volume referrers
   - Rate limiting on referral code usage

#### Edge Cases

1. **Payment Reversal/Refund**
   - Reverse commission immediately
   - Notify referrer
   - Log reversal event
   - Adjust available balance

2. **Student Cancellation**
   - Reverse commission if cancelled within 7 days
   - Keep commission if cancelled after 7 days
   - Admin override possible
   - Audit trail for all decisions

3. **Ambassador Suspension**
   - Hold all pending commissions
   - Block new commission creation
   - Allow withdrawal of available commissions
   - Admin can reverse commissions if fraud proven

4. **Database Errors**
   - Idempotent commission creation
   - Retry-safe webhook processing
   - Transaction rollback on errors
   - Error logging and alerting

5. **Paystack Webhook Delays**
   - Commission created on webhook, not payment
   - Queue webhook events for processing
   - Handle out-of-order events
   - Manual reconciliation tool

#### Conflict Resolution

1. **Multiple Referral Codes**
   - First code used during registration wins
   - Later codes ignored
   - Clear user communication on attribution

2. **Referrer Status Change**
   - If referrer suspended before commission available:
     - Commission held in "Pending" status
     - Released if referrer reactivated
     - Reversed if referrer permanently suspended
   - If referrer promoted/demoted:
     - Existing commissions keep original rate
     - New commissions use new rate

3. **Payment Amount Mismatch**
   - If payment ≠ ₦5,000:
     - Block commission creation
     - Flag for admin review
     - Allow manual override

4. **System Downtime**
   - Webhook events queued
   - Commission creation retried
   - Manual backfill available
   - No data loss

---

## Functional Requirements

### FR-1: Referral Code Management

#### FR-1.1: Generate Referral Code
- **Description:** Generate unique referral code for new referrers
- **Trigger:** User becomes referrer (student registration, ambassador approval)
- **Input:** User ID, referrer type
- **Output:** 8-character alphanumeric code
- **Validation:** Code uniqueness, case-insensitive
- **Error Handling:** Retry on collision (max 5 attempts)

#### FR-1.2: Validate Referral Code
- **Description:** Validate referral code during registration
- **Trigger:** User enters referral code
- **Input:** Referral code
- **Output:** Valid/Invalid status, referrer info
- **Validation:** Code exists, referrer active
- **Error Handling:** Clear error message, suggest valid code

#### FR-1.3: Track Referral Code Usage
- **Description:** Track when referral codes are used
- **Trigger:** User submits registration with code
- **Input:** Referral code, user info, timestamp, IP
- **Output:** Usage record
- **Validation:** Rate limiting, duplicate detection
- **Error Handling:** Log failed attempts

### FR-2: Commission Management

#### FR-2.1: Create Commission
- **Description:** Create commission after successful payment
- **Trigger:** Paystack payment.success webhook
- **Input:** Payment reference, referral code, referrer type
- **Output:** Commission record with "Pending" status
- **Validation:** Payment verified, referral valid, not self-referral
- **Error Handling:** Idempotent, retry-safe

#### FR-2.2: Update Commission Status
- **Description:** Update commission status through lifecycle
- **Trigger:** Holding period expiration, withdrawal, reversal
- **Input:** Commission ID, new status
- **Output:** Updated commission record
- **Validation:** Valid status transition
- **Error Handling:** Audit trail, rollback on error

#### FR-2.3: Calculate Available Balance
- **Description:** Calculate withdrawable balance for referrer
- **Trigger:** Dashboard load, withdrawal request
- **Input:** Referrer ID
- **Output:** Available balance, pending balance, total earned
- **Validation:** Sum available commissions (past holding period)
- **Error Handling:** Cache for performance

#### FR-2.4: Reverse Commission
- **Description:** Reverse commission due to fraud/payment reversal
- **Trigger:** Paystack chargeback webhook, admin action
- **Input:** Commission ID, reason
- **Output:** Commission with "Reversed" status
- **Validation:** Commission not already paid
- **Error Handling:** Notify referrer, adjust balance

### FR-3: Withdrawal Management

#### FR-3.1: Submit Withdrawal Request
- **Description:** Referrer submits withdrawal request
- **Trigger:** User submits withdrawal form
- **Input:** Referrer ID, amount, commission IDs, bank details
- **Output:** Withdrawal record with "Pending" status
- **Validation:** Minimum amount, sufficient balance, active status
- **Error Handling:** Clear error messages

#### FR-3.2: Process Withdrawal
- **Description:** Admin processes withdrawal payment
- **Trigger:** Admin approves and pays
- **Input:** Withdrawal ID, payment reference, notes
- **Output:** Withdrawal with "Paid" status
- **Validation:** Withdrawal approved, payment successful
- **Error Handling:** Rollback on payment failure

#### FR-3.3: Reject Withdrawal
- **Description:** Admin rejects withdrawal request
- **Trigger:** Admin rejection
- **Input:** Withdrawal ID, reason
- **Output:** Withdrawal with "Rejected" status, commissions returned
- **Validation:** Withdrawal not already paid
- **Error Handling:** Notify referrer, return commissions

#### FR-3.4: List Withdrawals
- **Description:** List withdrawals for referrer or admin
- **Trigger:** Dashboard load, admin view
- **Input:** Referrer ID (optional), filters
- **Output:** Paginated withdrawal list
- **Validation:** Permission check
- **Error Handling:** Handle empty results

### FR-4: Ambassador Management

#### FR-4.1: Submit Campus Ambassador Application
- **Description:** Student applies to become Campus Ambassador
- **Trigger:** User submits application form
- **Input:** User info, campus details, motivation, references
- **Output:** Application with "Pending" status
- **Validation:** Required fields, eligibility check
- **Error Handling:** Clear error messages

#### FR-4.2: Review Ambassador Application
- **Description:** Admin reviews ambassador application
- **Trigger:** Admin views application
- **Input:** Application ID
- **Output:** Application details, referral history
- **Validation:** Admin permission
- **Error Handling:** Handle missing data

#### FR-4.3: Approve Ambassador Application
- **Description:** Admin approves ambassador application
- **Trigger:** Admin approval
- **Input:** Application ID, notes
- **Output:** Ambassador with "Active" status, referral code generated
- **Validation:** Application not already processed
- **Error Handling:** Notify user, generate code

#### FR-4.4: Reject Ambassador Application
- **Description:** Admin rejects ambassador application
- **Trigger:** Admin rejection
- **Input:** Application ID, reason
- **Output:** Application with "Rejected" status
- **Validation:** Application not already processed
- **Error Handling:** Notify user

#### FR-4.5: Invite Partner Ambassador
- **Description:** Admin invites Partner Ambassador
- **Trigger:** Admin sends invitation
- **Input:** Email, name, invitation message
- **Output:** Ambassador with "Pending" status, invitation sent
- **Validation:** Email not already registered
- **Error Handling:** Handle send failure

#### FR-4.6: Manage Ambassador Status
- **Description:** Admin updates ambassador status
- **Trigger:** Admin action, automatic rules
- **Input:** Ambassador ID, new status, reason
- **Output:** Updated ambassador status
- **Validation:** Valid status transition
- **Error Handling:** Notify ambassador, handle commissions

### FR-5: Analytics and Reporting

#### FR-5.1: Track Referral Metrics
- **Description:** Track referral performance metrics
- **Trigger:** Continuous
- **Input:** Referral events
- **Output:** Metrics (clicks, conversions, revenue)
- **Validation:** Data integrity
- **Error Handling:** Logging

#### FR-5.2: Generate Referrer Report
- **Description:** Generate report for individual referrer
- **Trigger:** Dashboard load, export
- **Input:** Referrer ID, date range
- **Output:** Commissions, referrals, earnings, withdrawals
- **Validation:** Permission check
- **Error Handling:** Handle missing data

#### FR-5.3: Generate Admin Growth Report
- **Description:** Generate growth analytics for admin
- **Trigger:** Admin dashboard load, export
- **Input:** Date range, filters
- **Output:** Total referrals, revenue, commissions, top referrers
- **Validation:** Admin permission
- **Error Handling:** Aggregation errors

#### FR-5.4: Track Fraud Metrics
- **Description:** Track fraud detection metrics
- **Trigger:** Continuous
- **Input:** Fraud events
- **Output:** Fraud attempts, blocked referrals, reversals
- **Validation:** Data integrity
- **Error Handling:** Alerting

### FR-6: Notifications

#### FR-6.1: Send Commission Created Notification
- **Description:** Notify referrer of new commission
- **Trigger:** Commission created
- **Input:** Referrer ID, commission details
- **Output:** In-app notification, email
- **Validation:** User preferences
- **Error Handling:** Retry on failure

#### FR-6.2: Send Commission Available Notification
- **Description:** Notify referrer commission is available
- **Trigger:** Holding period expires
- **Input:** Referrer ID, commission details
- **Output:** In-app notification, email
- **Validation:** User preferences
- **Error Handling:** Retry on failure

#### FR-6.3: Send Withdrawal Status Notifications
- **Description:** Notify referrer of withdrawal status changes
- **Trigger:** Withdrawal status change
- **Input:** Referrer ID, withdrawal details
- **Output:** In-app notification, email
- **Validation:** User preferences
- **Error Handling:** Retry on failure

#### FR-6.4: Send Ambassador Status Notifications
- **Description:** Notify ambassador of status changes
- **Trigger:** Ambassador status change
- **Input:** Ambassador ID, status details
- **Output:** In-app notification, email
- **Validation:** User preferences
- **Error Handling:** Retry on failure

#### FR-6.5: Send Admin Notifications
- **Description:** Notify admin of growth events
- **Trigger:** High-value events, fraud alerts
- **Input:** Event details
- **Output:** In-app notification, email
- **Validation:** Admin preferences
- **Error Handling:** Retry on failure

### FR-7: Security and Fraud Prevention

#### FR-7.1: Detect Self-Referral
- **Description:** Block self-referral attempts
- **Trigger:** Referral code usage
- **Input:** Referrer ID, referee user info
- **Output:** Block/Allow decision
- **Validation:** Email, IP, device fingerprint
- **Error Handling:** Log attempt, alert admin

#### FR-7.2: Detect Duplicate Commissions
- **Description:** Prevent duplicate commission creation
- **Trigger:** Commission creation
- **Input:** Payment reference, referral code
- **Output:** Create/Skip decision
- **Validation:** Check existing commissions
- **Error Handling:** Idempotent operation

#### FR-7.3: Detect Suspicious Patterns
- **Description:** Detect fraud patterns
- **Trigger:** Continuous monitoring
- **Input:** Referral activity data
- **Output:** Fraud score, alert
- **Validation:** Pattern recognition
- **Error Handling:** False positive handling

#### FR-7.4: Rate Limit Referral Code Usage
- **Description:** Prevent abuse of referral codes
- **Trigger:** Referral code usage
- **Input:** Referral code, IP, timestamp
- **Output:** Allow/Block decision
- **Validation:** Rate limits
- **Error Handling:** Log blocks

---

## Non-Functional Requirements

### NFR-1: Performance

- **Response Time:** API endpoints < 200ms (p95)
- **Dashboard Load:** < 1 second
- **Webhook Processing:** < 5 seconds
- **Report Generation:** < 30 seconds for standard reports
- **Database Queries:** Optimized with proper indexes

### NFR-2: Scalability

- **Concurrent Users:** Support 10,000+ concurrent users
- **Referral Volume:** Handle 100,000+ referrals/month
- **Commission Volume:** Handle 100,000+ commissions/month
- **Database Growth:** Design for 3+ years of data
- **Horizontal Scaling:** Stateless API design

### NFR-3: Availability

- **Uptime:** 99.9% availability target
- **Webhook Reliability:** At-least-once delivery guarantee
- **Data Durability:** No data loss (database backups)
- **Graceful Degradation:** Queue during high load

### NFR-4: Security

- **Authentication:** Clerk authentication integration
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** Encrypted at rest (Supabase) and in transit (HTTPS)
- **Audit Logging:** Complete audit trail for all operations
- **Rate Limiting:** Prevent abuse and DDoS

### NFR-5: Maintainability

- **Code Quality:** TypeScript, ESLint, Prettier
- **Documentation:** Inline comments, API docs
- **Testing:** Unit, integration, E2E tests
- **Monitoring:** Error tracking, performance monitoring
- **Logging:** Structured logging with correlation IDs

### NFR-6: Usability

- **Mobile Responsive:** All pages mobile-optimized
- **Accessibility:** WCAG 2.1 AA compliance
- **User Experience:** Intuitive flows, clear feedback
- **Error Messages:** User-friendly, actionable
- **Loading States:** Clear progress indicators

### NFR-7: Integration

- **Paystack:** Leverage existing integration
- **Clerk:** Leverage existing authentication
- **Supabase:** Extend existing schema
- **Notifications:** Leverage existing notification system
- **Analytics:** Leverage existing analytics system

---

## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Student Dashboard  │  Ambassador Dashboard  │  Admin Dashboard  │
│  - Referral UI     │  - Commission UI       │  - Growth Module  │
│  - Earnings UI     │  - Withdrawal UI       │  - Analytics      │
│  - Referral Link   │  - Application UI      │  - Approvals      │
└────────────────────┴──────────────────────────┴─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  /api/growth/*  │  /api/admin/growth/*  │  /api/webhooks/*      │
│  - Referral     │  - Ambassador          │  - Paystack           │
│  - Commission   │  - Commission          │  - Commission Webhook │
│  - Withdrawal   │  - Withdrawal          │                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  GrowthService  │  CommissionService  │  WithdrawalService      │
│  - Referral     │  - Calculation       │  - Processing          │
│  - Attribution  │  - Lifecycle         │  - Validation          │
│                 │                      │                        │
│  AmbassadorService  │  FraudService     │  NotificationService   │
│  - Application     │  - Detection       │  - (Existing)          │
│  - Status          │  - Prevention      │                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                          │
│  - Existing Tables (extended)                                   │
│  - New Growth Tables                                            │
│  - RLS Policies                                                 │
│  - Indexes                                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├─────────────────────────────────────────────────────────────────┤
│  Paystack  │  Clerk  │  Email Service  │  Push Notifications    │
└─────────────────────────────────────────────────────────────────┘
```

### Service Layer Design

#### GrowthService
- **Responsibility:** Core growth engine orchestration
- **Methods:**
  - `generateReferralCode(userId, type)`
  - `validateReferralCode(code)`
  - `trackReferralUsage(code, userId, metadata)`
  - `attributeReferral(enrollmentId, code)`

#### CommissionService
- **Responsibility:** Commission lifecycle management
- **Methods:**
  - `createCommission(paymentRef, referralCode)`
  - `updateCommissionStatus(commissionId, status)`
  - `calculateAvailableBalance(userId)`
  - `reverseCommission(commissionId, reason)`
  - `releaseHeldCommissions(userId)`

#### WithdrawalService
- **Responsibility:** Withdrawal processing
- **Methods:**
  - `submitWithdrawal(userId, amount, commissionIds, bankDetails)`
  - `approveWithdrawal(withdrawalId, paymentRef)`
  - `rejectWithdrawal(withdrawalId, reason)`
  - `listWithdrawals(userId, filters)`

#### AmbassadorService
- **Responsibility:** Ambassador management
- **Methods:**
  - `submitApplication(userId, applicationData)`
  - `reviewApplication(applicationId)`
  - `approveApplication(applicationId, notes)`
  - `rejectApplication(applicationId, reason)`
  - `invitePartnerAmbassador(email, name, message)`
  - `updateAmbassadorStatus(ambassadorId, status, reason)`
  - `checkPromotionEligibility(ambassadorId)`

#### FraudService
- **Responsibility:** Fraud detection and prevention
- **Methods:**
  - `detectSelfReferral(referrerId, refereeData)`
  - `detectDuplicateCommission(paymentRef, referralCode)`
  - `calculateFraudScore(userId, activity)`
  - `checkRateLimit(code, ip)`
  - `blockSuspiciousActivity(userId, reason)`

### Integration Points

#### Existing Systems Integration

1. **Enrollment System**
   - Extend `enrollments` table (already has referral columns)
   - Hook into enrollment creation for referral attribution
   - No changes to existing enrollment flow

2. **Payment System**
   - Extend existing Paystack webhook handler
   - Add commission creation to payment.success webhook
   - Add commission reversal to chargeback webhook
   - Leverage existing `payment_events` table

3. **Notification System**
   - Leverage existing `createNotification` function
   - Add new notification categories (commission, withdrawal, ambassador)
   - Use existing delivery channels (in-app, email, push)

4. **Analytics System**
   - Extend existing analytics with growth metrics
   - Leverage existing analytics infrastructure
   - Add growth-specific reports

5. **Authentication**
   - Leverage existing Clerk integration
   - Use existing user management
   - Extend user roles for ambassador types

6. **Admin Dashboard**
   - Add new Growth module to existing admin dashboard
   - Leverage existing admin authentication
   - Follow existing admin UI patterns

---

## Data Model

### Database Schema Design

#### New Tables

##### 1. referral_codes
Stores referral codes and their owners.

```sql
CREATE TABLE referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  owner_id VARCHAR(255) NOT NULL, -- Clerk user ID
  owner_type VARCHAR(50) NOT NULL CHECK (owner_type IN ('student', 'campus_ambassador', 'partner_ambassador')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_referral_codes_owner ON referral_codes(owner_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_status ON referral_codes(status);
CREATE INDEX idx_referral_codes_type ON referral_codes(owner_type);
```

##### 2. referral_clicks
Tracks referral link clicks.

```sql
CREATE TABLE referral_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referral_code VARCHAR(8) NOT NULL REFERENCES referral_codes(code),
  clicked_by VARCHAR(255), -- Clerk user ID if logged in
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_enrollment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_converted ON referral_clicks(converted);
CREATE INDEX idx_referral_clicks_created ON referral_clicks(created_at DESC);
CREATE INDEX idx_referral_clicks_ip ON referral_clicks(ip_address);
```

##### 3. commissions
Stores commission records.

```sql
CREATE TABLE commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id VARCHAR(255) NOT NULL, -- Clerk user ID
  referrer_type VARCHAR(50) NOT NULL CHECK (referrer_type IN ('student', 'campus_ambassador', 'partner_ambassador')),
  referee_id VARCHAR(255) NOT NULL, -- Clerk user ID of referred student
  referee_email VARCHAR(255) NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  payment_reference VARCHAR(255) NOT NULL REFERENCES payments(reference),
  referral_code VARCHAR(8) NOT NULL REFERENCES referral_codes(code),
  amount INTEGER NOT NULL, -- Commission amount in Naira
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawing', 'paid', 'reversed')),
  holding_period_ends_at TIMESTAMP WITH TIME ZONE,
  withdrawal_id UUID REFERENCES withdrawals(id),
  reversal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_commissions_referrer ON commissions(referrer_id);
CREATE INDEX idx_commissions_referee ON commissions(referee_id);
CREATE INDEX idx_commissions_payment ON commissions(payment_reference);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_withdrawal ON commissions(withdrawal_id);
CREATE INDEX idx_commissions_holding ON commissions(holding_period_ends_at);
CREATE UNIQUE INDEX idx_commissions_payment_unique ON commissions(payment_reference);
```

##### 4. withdrawals
Stores withdrawal requests.

```sql
CREATE TABLE withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('student', 'campus_ambassador', 'partner_ambassador')),
  amount INTEGER NOT NULL, -- Withdrawal amount in Naira
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  account_name VARCHAR(255),
  payment_reference VARCHAR(255), -- Admin's payment reference
  rejection_reason TEXT,
  admin_notes TEXT,
  processed_by VARCHAR(255), -- Clerk user ID of admin
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created ON withdrawals(created_at DESC);
CREATE INDEX idx_withdrawals_processed ON withdrawals(processed_by);
```

##### 5. withdrawal_commissions
Junction table for withdrawal-commission relationship.

```sql
CREATE TABLE withdrawal_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  withdrawal_id UUID NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Commission amount at time of withdrawal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(withdrawal_id, commission_id)
);

-- Indexes
CREATE INDEX idx_withdrawal_commissions_withdrawal ON withdrawal_commissions(withdrawal_id);
CREATE INDEX idx_withdrawal_commissions_commission ON withdrawal_commissions(commission_id);
```

##### 6. ambassador_applications
Stores campus ambassador applications.

```sql
CREATE TABLE ambassador_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  campus_location VARCHAR(255) NOT NULL,
  student_id VARCHAR(100),
  level_of_study VARCHAR(100),
  course_of_study VARCHAR(255),
  graduation_year INTEGER,
  motivation TEXT NOT NULL,
  marketing_plan TEXT,
  social_media_links JSONB,
  referral_count INTEGER DEFAULT 0, -- Current referral count
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by VARCHAR(255), -- Clerk user ID of admin
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ambassador_applications_user ON ambassador_applications(user_id);
CREATE INDEX idx_ambassador_applications_status ON ambassador_applications(status);
CREATE INDEX idx_ambassador_applications_institution ON ambassador_applications(institution);
```

##### 7. ambassadors
Stores approved ambassadors.

```sql
CREATE TABLE ambassadors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  ambassador_type VARCHAR(50) NOT NULL CHECK (ambassador_type IN ('campus_ambassador', 'partner_ambassador')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  institution VARCHAR(255),
  campus_location VARCHAR(255),
  referral_code_id UUID REFERENCES referral_codes(id),
  total_referrals INTEGER DEFAULT 0,
  total_commissions INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0, -- In Naira
  total_withdrawn INTEGER DEFAULT 0, -- In Naira
  promotion_eligible BOOLEAN DEFAULT false,
  promotion_eligible_at TIMESTAMP WITH TIME ZONE,
  status_change_reason TEXT,
  status_changed_by VARCHAR(255), -- Clerk user ID of admin
  status_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ambassadors_user ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_type ON ambassadors(ambassador_type);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
CREATE INDEX idx_ambassadors_referral_code ON ambassadors(referral_code_id);
```

##### 8. fraud_alerts
Stores fraud detection alerts.

```sql
CREATE TABLE fraud_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('self_referral', 'duplicate_commission', 'suspicious_pattern', 'rate_limit_exceeded', 'payment_anomaly')),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id VARCHAR(255), -- Related user
  referral_code VARCHAR(8),
  payment_reference VARCHAR(255),
  ip_address INET,
  description TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_by VARCHAR(255), -- Clerk user ID of admin
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fraud_alerts_type ON fraud_alerts(alert_type);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_created ON fraud_alerts(created_at DESC);
```

##### 9. growth_analytics
Daily growth analytics snapshots.

```sql
CREATE TABLE growth_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_commissions INTEGER DEFAULT 0,
  total_commission_amount INTEGER DEFAULT 0,
  total_withdrawals INTEGER DEFAULT 0,
  total_withdrawal_amount INTEGER DEFAULT 0,
  active_referrers INTEGER DEFAULT 0,
  active_ambassadors INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  fraud_attempts INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- Indexes
CREATE INDEX idx_growth_analytics_date ON growth_analytics(snapshot_date DESC);
```

#### Extended Tables

##### enrollments (Extension)
Already has referral columns. No schema changes needed.

```sql
-- Existing columns (no changes):
-- referral_code VARCHAR(100)
-- referred_by_code VARCHAR(100)
```

##### notifications (Extension)
Add new categories for growth notifications.

```sql
-- Add to existing notification categories:
-- 'commission', 'withdrawal', 'ambassador'
```

##### notification_preferences (Extension)
Add new preferences for growth notifications.

```sql
ALTER TABLE notification_preferences ADD COLUMN commission_notifications BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN withdrawal_notifications BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN ambassador_notifications BOOLEAN DEFAULT true;
```

### Relationships

```
referral_codes (1) ────── (N) referral_clicks
referral_codes (1) ────── (N) commissions
referral_codes (1) ────── (1) ambassadors

ambassador_applications (1) ────── (1) ambassadors

commissions (N) ────── (1) withdrawals
commissions (N) ────── (N) withdrawal_commissions
commissions (1) ────── (1) enrollments
commissions (1) ────── (1) payments

withdrawals (1) ────── (N) withdrawal_commissions

users (Clerk) ────── (N) referral_codes
users (Clerk) ────── (N) commissions (as referrer)
users (Clerk) ────── (N) commissions (as referee)
users (Clerk) ────── (N) withdrawals
users (Clerk) ────── (N) ambassadors
users (Clerk) ────── (N) ambassador_applications
```

### RLS Strategy

#### Policy: No Direct Access
All growth tables use the same RLS strategy as existing tables:
- No public INSERT/UPDATE/DELETE/SELECT policies
- All operations use `supabaseAdmin` (service role)
- Authorization enforced at API route level
- This ensures consistency with existing architecture

#### Audit Logging
All growth operations will be logged using the existing audit logging system:
- Commission creation/reversal
- Withdrawal requests/processing
- Ambassador status changes
- Fraud alerts

---

## User Flows

### UF-1: Student Referral Flow

#### Step 1: Student Becomes Referrer
1. Student logs into dashboard
2. Student navigates to "Refer & Earn" section
3. System generates unique referral code (if not exists)
4. System displays referral code and shareable link
5. Student copies code/link

#### Step 2: Student Shares Referral
1. Student shares referral code/link via:
   - Social media
   - Email
   - WhatsApp
   - Direct message
2. System tracks click when someone uses link
3. System records click in `referral_clicks`

#### Step 3: Referred Student Registers
1. Referred student visits registration page
2. Referred student enters referral code (optional)
3. System validates referral code
4. System shows referrer info (if valid)
5. Student proceeds with registration

#### Step 4: Referred Student Pays
1. Student completes registration
2. Student initiates ₦5,000 payment via Paystack
3. Student completes payment
4. Paystack sends payment.success webhook

#### Step 5: Commission Created
1. Webhook handler receives payment.success
2. System verifies payment (₦5,000)
3. System checks for referral code in enrollment
4. System validates referrer (active, not self-referral)
5. System creates commission (₦1,000)
6. System sets commission status to "pending"
7. System sets holding period (7 days)
8. System notifies referrer (commission created)

#### Step 6: Commission Available
1. After 7 days, scheduled job checks commissions
2. System updates commission status to "available"
3. System notifies referrer (commission available)
4. Referrer can now withdraw

### UF-2: Campus Ambassador Application Flow

#### Step 1: Student Views Application
1. Student logs into dashboard
2. Student navigates to "Become Ambassador" section
3. System displays ambassador benefits
4. System displays eligibility criteria
5. Student clicks "Apply Now"

#### Step 2: Student Submits Application
1. System displays application form
2. Student fills in:
   - Personal info (name, email, phone)
   - Institution info (campus, location, student ID)
   - Academic info (level, course, graduation year)
   - Motivation (why they want to be ambassador)
   - Marketing plan (how they will promote)
   - Social media links
3. Student submits application
4. System validates required fields
5. System creates application record (status: "pending")
6. System notifies student (application submitted)
7. System notifies admin (new application)

#### Step 3: Admin Reviews Application
1. Admin navigates to "Ambassador Applications"
2. Admin views application details
3. Admin checks student's referral history
4. Admin reviews application content
5. Admin makes decision

#### Step 4: Admin Approves Application
1. Admin clicks "Approve"
2. System creates ambassador record (status: "active")
3. System generates referral code
4. System links referral code to ambassador
5. System updates application status to "approved"
6. System notifies student (approved)
7. System sends welcome email

#### Step 5: Admin Rejects Application
1. Admin clicks "Reject"
2. Admin enters rejection reason
3. System updates application status to "rejected"
4. System notifies student (rejected with reason)

### UF-3: Partner Ambassador Invitation Flow

#### Step 1: Admin Initiates Invitation
1. Admin navigates to "Partner Ambassadors"
2. Admin clicks "Invite Partner"
3. System displays invitation form

#### Step 2: Admin Sends Invitation
1. Admin enters:
   - Partner email
   - Partner name
   - Personal message
2. Admin clicks "Send Invitation"
3. System creates ambassador record (status: "pending")
4. System generates referral code
5. System sends invitation email
6. System logs invitation

#### Step 3: Partner Accepts Invitation
1. Partner receives invitation email
2. Partner clicks acceptance link
3. Partner logs in or registers
4. System activates ambassador account
5. System updates status to "active"
6. System displays ambassador dashboard
7. System sends welcome email

### UF-4: Commission Creation Flow

#### Step 1: Payment Webhook Received
1. Paystack sends payment.success webhook
2. API endpoint receives webhook
3. System verifies webhook signature
4. System processes webhook

#### Step 2: Payment Verification
1. System retrieves payment details
2. System verifies payment amount (₦5,000)
3. System checks payment status (success)
4. System retrieves enrollment details

#### Step 3: Referral Validation
1. System checks enrollment for referral code
2. If no referral code, skip commission
3. If referral code exists:
   - System validates referral code
   - System retrieves referrer details
   - System checks referrer status (active)
   - System checks for self-referral (same email/clerk_id)
   - System checks for duplicate commission

#### Step 4: Commission Creation
1. System determines commission amount:
   - Student referrer: ₦1,000
   - Campus ambassador: ₦1,000
   - Partner ambassador: ₦2,000
2. System creates commission record:
   - Referrer ID
   - Referrer type
   - Referee ID
   - Referee email
   - Enrollment ID
   - Payment reference
   - Referral code
   - Amount
   - Status: "pending"
   - Holding period: now() + 7 days
3. System updates referrer stats
4. System updates referral code stats
5. System logs commission creation

#### Step 5: Notification
1. System sends commission created notification to referrer
2. System updates referral click (if exists) to "converted"
3. System creates growth analytics snapshot

### UF-5: Withdrawal Flow

#### Step 1: Referrer Views Dashboard
1. Referrer logs into dashboard
2. Referrer navigates to "Earnings" section
3. System displays:
   - Total earned
   - Available balance
   - Pending balance
   - Withdrawal history

#### Step 2: Referrer Initiates Withdrawal
1. Referrer clicks "Withdraw"
2. System displays withdrawal form
3. System shows available commissions
4. Referrer selects commissions to withdraw
5. System calculates total amount
6. System validates minimum amount (₦2,000)
7. Referrer enters bank details:
   - Bank name
   - Account number
   - Account name
8. Referrer submits withdrawal

#### Step 3: Withdrawal Validation
1. System validates referrer status (active)
2. System validates selected commissions (available)
3. System validates total amount (≥ ₦2,000)
4. System checks for pending withdrawals
5. System creates withdrawal record:
   - User ID
   - User type
   - Amount
   - Status: "pending"
   - Bank details
6. System links selected commissions
7. System updates commission status to "withdrawing"
8. System notifies referrer (withdrawal submitted)
9. System notifies admin (new withdrawal)

#### Step 4: Admin Reviews Withdrawal
1. Admin navigates to "Withdrawals"
2. Admin views withdrawal details
3. Admin checks referrer history
4. Admin reviews bank details
5. Admin makes decision

#### Step 5: Admin Approves Withdrawal
1. Admin clicks "Approve"
2. System updates withdrawal status to "approved"
3. System notifies referrer (approved)
4. Admin processes bank transfer
5. Admin enters payment reference
6. System updates withdrawal status to "paid"
7. System updates commission status to "paid"
8. System updates referrer stats
9. System notifies referrer (paid)

#### Step 6: Admin Rejects Withdrawal
1. Admin clicks "Reject"
2. Admin enters rejection reason
3. System updates withdrawal status to "rejected"
4. System returns commissions to "available"
5. System notifies referrer (rejected with reason)

### UF-6: Commission Payment Flow

#### Step 1: Payment Reversal Detected
1. Paystack sends chargeback webhook
2. API endpoint receives webhook
3. System verifies webhook signature
4. System processes webhook

#### Step 2: Commission Reversal
1. System retrieves payment reference
2. System finds related commission
3. System checks commission status (not already paid)
4. System reverses commission:
   - Status: "reversed"
   - Reversal reason: "payment reversed"
5. System updates referrer stats
6. System logs reversal
7. System notifies referrer (commission reversed)
8. System notifies admin (commission reversed)

### UF-7: Ambassador Suspension Flow

#### Step 1: Fraud Detected
1. Fraud system detects suspicious activity
2. System creates fraud alert
3. System notifies admin

#### Step 2: Admin Investigates
1. Admin reviews fraud alert
2. Admin checks user activity
3. Admin makes decision

#### Step 3: Admin Suspends Ambassador
1. Admin clicks "Suspend"
2. Admin enters suspension reason
3. System updates ambassador status to "suspended"
4. System holds all pending commissions
5. System blocks new commission creation
6. System notifies ambassador (suspended)
7. System logs suspension

#### Step 4: Ambassador Reactivation
1. Admin clicks "Reactivate"
2. Admin enters reactivation reason
3. System updates ambassador status to "active"
4. System releases held commissions
5. System allows new commission creation
6. System notifies ambassador (reactivated)
7. System logs reactivation

### UF-8: Ambassador Promotion Flow

#### Step 1: Eligibility Check
1. Scheduled job checks ambassador eligibility
2. System checks criteria:
   - Student → Campus: 10+ referrals, 6+ months, clean record
   - Campus → Partner: 50+ referrals, 12+ months, high conversion
3. System updates eligible ambassadors

#### Step 2: Admin Reviews Eligibility
1. Admin navigates to "Ambassador Promotions"
2. Admin views eligible ambassadors
3. Admin reviews ambassador performance
4. Admin makes decision

#### Step 3: Admin Promotes Ambassador
1. Admin clicks "Promote"
2. System updates ambassador type
3. System updates commission rate for future commissions
4. System notifies ambassador (promoted)
5. System logs promotion

### UF-9: Referral Tracking Flow

#### Step 1: Referral Link Clicked
1. Potential student clicks referral link
2. System tracks click:
   - Referral code
   - IP address
   - User agent
   - Referrer URL
   - UTM parameters
3. System stores in `referral_clicks`
4. System redirects to registration page with code

#### Step 2: Student Registers
1. Student sees referral code pre-filled
2. Student completes registration
3. System updates referral click with user ID
4. System stores referral code in enrollment

#### Step 3: Conversion Tracking
1. Student completes payment
2. Commission is created
3. System updates referral click to "converted"
4. System links to enrollment
5. System updates conversion metrics

---

## Security

### Fraud Prevention Strategy

#### FP-1: Self-Referral Prevention

**Detection Methods:**
1. **Email Match:** Block if referee email matches referrer email
2. **User ID Match:** Block if referee clerk_user_id matches referrer
3. **IP Address:** Block if same IP within 24 hours
4. **Device Fingerprint:** Block if same device fingerprint
5. **Bank Details:** Flag if same bank details

**Implementation:**
- Check during commission creation
- Log all blocked attempts
- Create fraud alert for suspicious patterns
- Allow admin override for legitimate cases

#### FP-2: Duplicate Commission Prevention

**Detection Methods:**
1. **Payment Reference Uniqueness:** One commission per payment reference
2. **Enrollment Uniqueness:** One commission per enrollment
3. **Idempotent Creation:** Safe for webhook retries

**Implementation:**
- Unique constraint on commissions.payment_reference
- Check existing commissions before creation
- Use database transactions
- Log all attempts

#### FP-3: Fake Payment Prevention

**Detection Methods:**
1. **Paystack Verification:** Require successful webhook
2. **Amount Validation:** Must be exactly ₦5,000
3. **Test Mode Blocking:** Block test mode payments
4. **Payment Pattern Analysis:** Flag rapid payments

**Implementation:**
- Only create commission on verified payment
- Validate payment amount
- Check payment metadata
- Monitor for suspicious patterns

#### FP-4: Multiple Account Prevention

**Detection Methods:**
1. **IP Address Correlation:** Flag multiple accounts from same IP
2. **Bank Detail Correlation:** Flag same bank details
3. **Device Fingerprint:** Flag same device
4. **Behavioral Analysis:** Flag similar patterns

**Implementation:**
- Track IP addresses per user
- Monitor registration patterns
- Create fraud alerts for suspicious activity
- Manual review for high-risk cases

#### FP-5: Commission Abuse Prevention

**Detection Methods:**
1. **Holding Period:** 7-day hold before withdrawal
2. **Automatic Reversal:** Reverse on payment reversal
3. **Volume Monitoring:** Flag high-volume referrers
4. **Conversion Rate Analysis:** Flag abnormal conversion rates

**Implementation:**
- Enforce holding period
- Implement automatic reversal
- Monitor referral volume
- Admin review for high performers

### Security Measures

#### SM-1: Authentication & Authorization

**Authentication:**
- Use existing Clerk authentication
- No anonymous access to growth features
- Session management via Clerk

**Authorization:**
- Role-based access control (RBAC)
- Roles: student, campus_ambassador, partner_ambassador, admin
- API route permission checks
- Service role for admin operations

#### SM-2: Data Protection

**Encryption:**
- Data at rest: Supabase encryption
- Data in transit: HTTPS/TLS
- Sensitive data: Bank details encrypted

**Data Privacy:**
- GDPR compliance
- Data retention policies
- Right to deletion
- Audit trail for all access

#### SM-3: API Security

**Rate Limiting:**
- Per-user rate limits
- Per-IP rate limits
- Endpoint-specific limits
- DDoS protection

**Input Validation:**
- Server-side validation
- SQL injection prevention (parameterized queries)
- XSS prevention
- CSRF protection

**Webhook Security:**
- Paystack signature verification
- Idempotent processing
- Event replay protection
- Logging and monitoring

#### SM-4: Audit Logging

**Logging Requirements:**
- All commission operations
- All withdrawal operations
- All ambassador status changes
- All fraud alerts
- All admin actions

**Log Format:**
- Timestamp
- User ID
- Action
- Resource
- Changes
- IP address
- User agent

**Log Retention:**
- 1 year for operational logs
- 7 years for audit logs
- Secure storage
- Regular backups

#### SM-5: Race Condition Prevention

**Strategies:**
1. **Database Transactions:** Use transactions for multi-step operations
2. **Optimistic Locking:** Version checks for updates
3. **Idempotent Operations:** Safe for retries
4. **Queue Processing:** Sequential processing of webhooks
5. **Unique Constraints:** Database-level uniqueness

**Examples:**
- Commission creation: Transaction with enrollment update
- Withdrawal submission: Lock commissions during creation
- Status updates: Version checks to prevent conflicts

#### SM-6: Replay Attack Prevention

**Strategies:**
1. **Event ID Tracking:** Track processed webhook events
2. **Idempotent Operations:** Safe for duplicate events
3. **Timestamp Validation:** Reject old events
4. **Signature Verification:** Verify webhook signatures

**Implementation:**
- Store processed event IDs
- Check before processing
- Use event_id for idempotency

### Security Monitoring

#### Alerting
- High-severity fraud alerts
- Unusual withdrawal patterns
- Failed webhook processing
- Authentication anomalies
- Rate limit violations

#### Monitoring
- Real-time dashboards
- Automated alerts
- Regular security audits
- Penetration testing
- Vulnerability scanning

---

## Testing

### Test Strategy

#### Unit Tests

**Coverage:**
- Service layer functions
- Business logic validation
- Utility functions
- Fraud detection algorithms

**Examples:**
- `generateReferralCode()` - uniqueness, format
- `validateReferralCode()` - validity, referrer status
- `calculateCommissionAmount()` - correct amount per type
- `detectSelfReferral()` - email, IP, user ID matching
- `calculateAvailableBalance()` - sum available commissions

#### Integration Tests

**Coverage:**
- API endpoints
- Database operations
- External service integration
- Webhook processing

**Examples:**
- POST /api/growth/referral - commission creation flow
- POST /api/growth/withdrawal - withdrawal submission
- POST /api/webhooks/paystack - payment webhook processing
- Commission creation with Paystack integration
- Notification delivery

#### Journey Tests

**Coverage:**
- End-to-end user flows
- Multi-step processes
- Cross-system integration

**Examples:**
- Student referral flow (share → register → pay → commission)
- Ambassador application flow (apply → review → approve)
- Withdrawal flow (request → approve → pay)
- Commission reversal flow (payment reversal → commission reversal)

#### Regression Tests

**Coverage:**
- Existing functionality
- Integration points
- Performance benchmarks

**Examples:**
- Enrollment flow still works with referral code
- Payment flow still works with commission creation
- Notifications still work with new categories
- Analytics still work with new metrics

### Test Scenarios

#### TS-1: Referral Code Generation
**Test Case:** Generate unique referral code
**Steps:**
1. Call generateReferralCode()
2. Verify code format (8 chars, alphanumeric)
3. Verify code uniqueness
4. Verify code case-insensitivity
**Expected:** Valid, unique code generated

#### TS-2: Commission Creation
**Test Case:** Create commission after payment
**Steps:**
1. Simulate Paystack payment.success webhook
2. Verify payment (₦5,000)
3. Check referral code in enrollment
4. Validate referrer
5. Create commission
6. Verify commission record
7. Verify notification sent
**Expected:** Commission created with correct amount

#### TS-3: Self-Referral Blocking
**Test Case:** Block self-referral
**Steps:**
1. User A refers User A (same email)
2. Attempt commission creation
3. Verify commission not created
4. Verify fraud alert created
**Expected:** Commission blocked, fraud alert created

#### TS-4: Duplicate Commission Prevention
**Test Case:** Prevent duplicate commission
**Steps:**
1. Create commission for payment REF123
2. Attempt to create commission for REF123 again
3. Verify second attempt fails
4. Verify only one commission exists
**Expected:** Duplicate prevented

#### TS-5: Withdrawal Submission
**Test Case:** Submit withdrawal request
**Steps:**
1. Referrer has available balance ≥ ₦2,000
2. Submit withdrawal request
3. Verify withdrawal record created
4. Verify commissions linked
5. Verify commissions status updated
6. Verify notification sent
**Expected:** Withdrawal created successfully

#### TS-6: Commission Reversal
**Test Case:** Reverse commission on payment reversal
**Steps:**
1. Commission exists for payment REF123
2. Simulate Paystack chargeback webhook
3. Process reversal
4. Verify commission status = "reversed"
5. Verify referrer notified
**Expected:** Commission reversed successfully

#### TS-7: Ambassador Application
**Test Case:** Submit ambassador application
**Steps:**
1. Student submits application
2. Verify application record created
3. Verify notification sent to admin
4. Admin approves application
5. Verify ambassador record created
6. Verify referral code generated
**Expected:** Application approved, ambassador created

#### TS-8: Fraud Detection
**Test Case:** Detect suspicious pattern
**Steps:**
1. Multiple referrals from same IP
2. Rapid referral code usage
3. Verify fraud alert created
4. Verify admin notified
**Expected:** Fraud alert created

#### TS-9: Holding Period
**Test Case:** Enforce 7-day holding period
**Steps:**
1. Commission created today
2. Attempt withdrawal today
3. Verify withdrawal blocked
4. Wait 7 days
5. Attempt withdrawal again
6. Verify withdrawal allowed
**Expected:** Withdrawal blocked until holding period ends

#### TS-10: Idempotent Webhook
**Test Case:** Handle duplicate webhook events
**Steps:**
1. Send payment.success webhook
2. Verify commission created
3. Send same webhook again
4. Verify no duplicate commission
5. Verify idempotent behavior
**Expected:** No duplicate commission

### Failure Scenarios

#### FS-1: Payment Webhook Failure
**Scenario:** Paystack webhook fails
**Recovery:**
- Queue webhook event
- Retry with exponential backoff
- Alert admin on repeated failures
- Manual reconciliation tool

#### FS-2: Database Connection Failure
**Scenario:** Database connection fails during commission creation
**Recovery:**
- Transaction rollback
- Retry operation
- Log error
- Alert admin

#### FS-3: Notification Delivery Failure
**Scenario:** Email notification fails
**Recovery:**
- Retry with exponential backoff
- Queue failed notifications
- Log failure
- In-app notification still delivered

#### FS-4: Paystack API Downtime
**Scenario:** Paystack API is down
**Recovery:**
- Queue operations
- Retry when service is available
- Graceful degradation
- User communication

#### FS-5: Race Condition
**Scenario:** Two webhook events processed simultaneously
**Recovery:**
- Database transactions
- Unique constraints
- Idempotent operations
- First write wins

### Recovery Scenarios

#### RS-1: Commission Data Correction
**Scenario:** Commission created with wrong amount
**Recovery:**
- Admin correction tool
- Update commission amount
- Log correction
- Notify referrer

#### RS-2: Missing Commission
**Scenario:** Commission not created due to system error
**Recovery:**
- Manual backfill tool
- Re-process payment event
- Create commission
- Notify referrer

#### RS-3: Withdrawal Processing Error
**Scenario:** Withdrawal approved but payment failed
**Recovery:**
- Admin can retry payment
- Commission status remains "withdrawing"
- Withdrawal status remains "approved"
- Manual correction available

#### RS-4: Ambassador Status Error
**Scenario:** Ambassador status incorrectly updated
**Recovery:**
- Admin can correct status
- Audit trail shows history
- Notify ambassador
- Release held commissions if applicable

---

## Implementation Roadmap

### Sprint 1: Foundation (Week 1-2)

**Goal:** Set up database schema and core services

**Tasks:**
1. Create database tables
   - referral_codes
   - referral_clicks
   - commissions
   - withdrawals
   - withdrawal_commissions
   - ambassador_applications
   - ambassadors
   - fraud_alerts
   - growth_analytics

2. Extend existing tables
   - notification_preferences (add growth notification columns)

3. Create core services
   - GrowthService
   - CommissionService
   - WithdrawalService
   - AmbassadorService
   - FraudService

4. Set up RLS policies
   - Apply restrictive policies to all new tables
   - Ensure service role access

5. Create audit logging integration
   - Log all growth operations
   - Integrate with existing audit system

**Deliverables:**
- Database schema deployed
- Core services implemented
- Unit tests for services
- Documentation

**Acceptance Criteria:**
- All tables created with proper indexes
- Services have unit tests with 80%+ coverage
- Audit logging functional
- No breaking changes to existing features

---

### Sprint 2: Referral System (Week 3-4)

**Goal:** Implement student referral functionality

**Tasks:**
1. Implement referral code generation
   - Generate code on user registration
   - Code uniqueness validation
   - Code display in dashboard

2. Implement referral validation
   - Validate code during registration
   - Display referrer info
   - Store code in enrollment

3. Implement referral tracking
   - Track referral link clicks
   - Store click metadata
   - UTM parameter support

4. Extend enrollment flow
   - Add referral code input to registration
   - Store referral code in enrollment
   - No changes to existing flow

5. Create student referral UI
   - Refer & Earn section in student dashboard
   - Display referral code and link
   - Display referral stats
   - Share functionality

6. Implement commission creation
   - Integrate with Paystack webhook
   - Validate payment and referral
   - Create commission record
   - Set holding period

7. Implement commission notifications
   - Commission created notification
   - Commission available notification
   - Commission reversed notification

**Deliverables:**
- Referral code generation
- Referral validation
- Referral tracking
- Commission creation
- Student referral UI
- Commission notifications
- Integration tests

**Acceptance Criteria:**
- Students can generate referral codes
- Referral codes are validated correctly
- Commissions created after successful payment
- Notifications sent correctly
- UI functional and responsive
- Integration tests passing

---

### Sprint 3: Withdrawal System (Week 5-6)

**Goal:** Implement withdrawal functionality

**Tasks:**
1. Implement withdrawal submission
   - Withdrawal form in dashboard
   - Commission selection
   - Bank details collection
   - Validation (minimum amount, balance)

2. Implement withdrawal processing
   - Admin withdrawal list
   - Withdrawal details view
   - Approve/reject functionality
   - Payment reference entry

3. Implement withdrawal notifications
   - Withdrawal submitted notification
   - Withdrawal approved notification
   - Withdrawal paid notification
   - Withdrawal rejected notification

4. Create withdrawal UI
   - Earnings section in student dashboard
   - Available balance display
   - Withdrawal history
   - Withdrawal form

5. Create admin withdrawal UI
   - Withdrawal management in admin dashboard
   - Pending withdrawals list
   - Withdrawal details modal
   - Approve/reject actions

6. Implement balance calculation
   - Available balance calculation
   - Pending balance calculation
   - Total earned calculation
   - Caching for performance

**Deliverables:**
- Withdrawal submission
- Withdrawal processing
- Withdrawal notifications
- Student withdrawal UI
- Admin withdrawal UI
- Balance calculation
- Integration tests

**Acceptance Criteria:**
- Students can submit withdrawals
- Admin can process withdrawals
- Balances calculated correctly
- Notifications sent correctly
- UI functional and responsive
- Integration tests passing

---

### Sprint 4: Ambassador System (Week 7-8)

**Goal:** Implement ambassador application and management

**Tasks:**
1. Implement campus ambassador application
   - Application form
   - Application submission
   - Application validation

2. Implement application review
   - Admin application list
   - Application details view
   - Approve/reject functionality
   - Referral history check

3. Implement partner ambassador invitation
   - Invitation form
   - Invitation email
   - Invitation acceptance flow

4. Implement ambassador management
   - Ambassador list
   - Ambassador details view
   - Status management
   - Promotion/demotion

5. Create ambassador application UI
   - Become Ambassador section in student dashboard
   - Application form
   - Application status display

6. Create admin ambassador UI
   - Ambassador management in admin dashboard
   - Applications list
   - Ambassadors list
   - Ambassador details modal

7. Implement ambassador notifications
   - Application submitted notification
   - Application approved notification
   - Application rejected notification
   - Status change notification

**Deliverables:**
- Campus ambassador application
- Partner ambassador invitation
- Ambassador management
- Ambassador application UI
- Admin ambassador UI
- Ambassador notifications
- Integration tests

**Acceptance Criteria:**
- Students can submit applications
- Admin can review applications
- Admin can invite partners
- Ambassador status manageable
- Notifications sent correctly
- UI functional and responsive
- Integration tests passing

---

### Sprint 5: Fraud Prevention (Week 9-10)

**Goal:** Implement fraud detection and prevention

**Tasks:**
1. Implement self-referral detection
   - Email matching
   - User ID matching
   - IP address matching
   - Device fingerprinting

2. Implement duplicate commission prevention
   - Payment reference uniqueness
   - Enrollment uniqueness
   - Idempotent creation

3. Implement suspicious pattern detection
   - IP correlation
   - Bank detail correlation
   - Behavioral analysis
   - Volume monitoring

4. Implement rate limiting
   - Referral code usage rate limit
   - API endpoint rate limiting
   - Per-user rate limiting

5. Create fraud alert system
   - Fraud alert creation
   - Alert severity classification
   - Alert management
   - Alert resolution

6. Create admin fraud UI
   - Fraud alerts in admin dashboard
   - Alert details view
   - Alert resolution actions
   - Fraud metrics dashboard

7. Implement commission reversal
   - Payment reversal webhook
   - Commission reversal logic
   - Referrer notification
   - Audit logging

**Deliverables:**
- Self-referral detection
- Duplicate commission prevention
- Suspicious pattern detection
- Rate limiting
- Fraud alert system
- Admin fraud UI
- Commission reversal
- Integration tests

**Acceptance Criteria:**
- Self-referrals blocked
- Duplicate commissions prevented
- Suspicious patterns detected
- Rate limits enforced
- Fraud alerts created
- Admin can manage alerts
- Commissions reversed correctly
- Integration tests passing

---

### Sprint 6: Analytics and Reporting (Week 11-12)

**Goal:** Implement analytics and reporting

**Tasks:**
1. Implement referral metrics tracking
   - Click tracking
   - Conversion tracking
   - Time-to-conversion tracking

2. Implement growth analytics
   - Daily analytics snapshots
   - Referral volume
   - Commission volume
   - Withdrawal volume
   - Conversion rates

3. Create referrer reports
   - Individual referrer performance
   - Referral history
   - Commission history
   - Withdrawal history
   - Earnings summary

4. Create admin growth reports
   - Overall growth metrics
   - Top referrers
   - Ambassador performance
   - Fraud metrics
   - Revenue impact

5. Create analytics UI
   - Growth analytics in student dashboard
   - Referral stats
   - Earnings breakdown
   - Performance charts

6. Create admin analytics UI
   - Growth analytics in admin dashboard
   - Overall metrics
   - Referrer leaderboards
   - Ambassador performance
   - Fraud metrics
   - Trend analysis

7. Implement scheduled jobs
   - Daily analytics snapshot
   - Holding period release
   - Eligibility check
   - Report generation

**Deliverables:**
- Referral metrics tracking
- Growth analytics
- Referrer reports
- Admin growth reports
- Analytics UI
- Admin analytics UI
- Scheduled jobs
- Integration tests

**Acceptance Criteria:**
- Metrics tracked correctly
- Analytics snapshots created
- Reports generated accurately
- UI displays correct data
- Scheduled jobs running
- Integration tests passing

---

### Sprint 7: Testing and Optimization (Week 13-14)

**Goal:** Comprehensive testing and performance optimization

**Tasks:**
1. Complete unit tests
   - Service layer tests
   - Utility function tests
   - Fraud detection tests
   - 90%+ coverage target

2. Complete integration tests
   - API endpoint tests
   - Database operation tests
   - Webhook processing tests
   - External service tests

3. Complete journey tests
   - Student referral flow
   - Ambassador application flow
   - Withdrawal flow
   - Commission reversal flow

4. Complete regression tests
   - Existing functionality
   - Integration points
   - Performance benchmarks

5. Performance optimization
   - Database query optimization
   - Index tuning
   - Caching implementation
   - API response time optimization

6. Load testing
   - Simulate high concurrent users
   - Test webhook processing
   - Test report generation
   - Identify bottlenecks

7. Security testing
   - Penetration testing
   - Vulnerability scanning
   - Security audit
   - Fix identified issues

**Deliverables:**
- Comprehensive test suite
- Performance optimizations
- Load test results
- Security audit report
- Bug fixes

**Acceptance Criteria:**
- 90%+ unit test coverage
- All integration tests passing
- All journey tests passing
- All regression tests passing
- API response time < 200ms (p95)
- Load test targets met
- Security audit passed

---

### Sprint 8: Documentation and Deployment (Week 15-16)

**Goal:** Documentation and production deployment

**Tasks:**
1. Create technical documentation
   - API documentation
   - Service documentation
   - Database documentation
   - Architecture documentation

2. Create user documentation
   - Student guide
   - Ambassador guide
   - Admin guide
   - FAQ

3. Create deployment documentation
   - Deployment checklist
   - Migration scripts
   - Environment configuration
   - Rollback procedures

4. Prepare production deployment
   - Database migration
   - Environment variables
   - Feature flags
   - Monitoring setup

5. Deploy to staging
   - Deploy to staging environment
   - Smoke testing
   - User acceptance testing
   - Performance testing

6. Deploy to production
   - Database migration
   - Application deployment
   - Feature enablement
   - Monitoring verification

7. Post-deployment verification
   - Monitor system health
   - Verify webhook processing
   - Verify notifications
   - Verify analytics
   - User feedback collection

**Deliverables:**
- Technical documentation
- User documentation
- Deployment documentation
- Staging deployment
- Production deployment
- Post-deployment report

**Acceptance Criteria:**
- Documentation complete
- Staging deployment successful
- UAT passed
- Production deployment successful
- Monitoring functional
- No critical bugs

---

## Risks

### Risk 1: Paystack Integration Issues

**Description:** Paystack webhook delays or failures could delay commission creation.

**Impact:** High - Commissions not created, user dissatisfaction

**Mitigation:**
- Implement webhook queuing
- Retry with exponential backoff
- Manual reconciliation tool
- Monitor webhook delivery

**Contingency:**
- Manual commission creation tool
- Admin can backfill missing commissions

### Risk 2: Fraud Detection False Positives

**Description:** Legitimate referrals flagged as fraud.

**Impact:** Medium - User dissatisfaction, lost revenue

**Mitigation:**
- Tunable fraud thresholds
- Manual review process
- Quick appeal process
- Continuous monitoring

**Contingency:**
- Admin can override fraud blocks
- Compensation for false positives

### Risk 3: Database Performance

**Description:** High volume of referrals could impact database performance.

**Impact:** Medium - Slow response times, system degradation

**Mitigation:**
- Proper indexing
- Query optimization
- Read replicas
- Caching strategy

**Contingency:**
- Database scaling
- Query optimization
- Archival of old data

### Risk 4: Commission Calculation Errors

**Description:** Incorrect commission amounts calculated.

**Impact:** High - Financial loss, user dissatisfaction

**Mitigation:**
- Comprehensive testing
- Code review
- Validation checks
- Audit logging

**Contingency:**
- Manual correction tool
- Commission adjustment process
- Refund process

### Risk 5: Withdrawal Processing Delays

**Description:** Admin unable to process withdrawals quickly.

**Impact:** Medium - User dissatisfaction

**Mitigation:**
- Efficient admin UI
- Batch processing
- Automated payment processing (future)
- Clear SLA

**Contingency:**
- Communication with users
- Priority processing for urgent cases

### Risk 6: Integration Breaking Changes

**Description:** Changes to existing systems break growth engine.

**Impact:** High - System failure

**Mitigation:**
- Integration tests
- Regression tests
- Version compatibility checks
- Feature flags

**Contingency:**
- Rollback procedures
- Hotfix process
- Emergency support

### Risk 7: Security Breach

**Description:** Unauthorized access to growth data or funds.

**Impact:** Critical - Financial loss, data breach

**Mitigation:**
- Security audits
- Penetration testing
- Access controls
- Encryption

**Contingency:**
- Incident response plan
- Security team notification
- User communication
- Forensic analysis

### Risk 8: Regulatory Compliance

**Description:** Non-compliance with financial regulations.

**Impact:** High - Legal issues, fines

**Mitigation:**
- Legal review
- Compliance checks
- Data privacy measures
- Audit trail

**Contingency:**
- Legal counsel
- Compliance adjustments
- Regulatory engagement

---

## Future Expansion

### FE-1: Automated Withdrawal Processing

**Description:** Integrate with Paystack Transfer for automated withdrawals.

**Benefits:**
- Faster withdrawal processing
- Reduced admin workload
- Better user experience

**Implementation:**
- Integrate Paystack Transfer API
- Bank account verification
- Automated payment processing
- Transaction reconciliation

### FE-2: Multi-Level Referral Program

**Description:** Implement multi-level (MLM) referral structure.

**Benefits:**
- Increased viral growth
- Higher engagement
- More complex incentives

**Implementation:**
- Multi-level commission structure
- Tree structure tracking
- Level-based commission rates
- Downline analytics

### FE-3: Gamification

**Description:** Add gamification elements to referral program.

**Benefits:**
- Increased engagement
- Competitive elements
- Achievement tracking

**Implementation:**
- Badges and achievements
- Leaderboards
- Challenges and contests
- Progress tracking

### FE-4: Advanced Analytics

**Description:** Implement advanced analytics and ML.

**Benefits:**
- Better insights
- Predictive analytics
- Fraud detection improvement

**Implementation:**
- Machine learning for fraud detection
- Predictive modeling
- Advanced segmentation
- Cohort analysis

### FE-5: Mobile App

**Description:** Develop dedicated mobile app for ambassadors.

**Benefits:**
- Better mobile experience
- Push notifications
- Offline functionality

**Implementation:**
- React Native or Flutter app
- API optimization
- Offline sync
- Push notification integration

### FE-6: International Expansion

**Description:** Expand to other countries and currencies.

**Benefits:**
- Larger market
- Diversified revenue
- Global reach

**Implementation:**
- Multi-currency support
- Local payment methods
- Localized content
- Compliance with local regulations

### FE-7: Integration with Learning Platform

**Description:** Deep integration with learning platform features.

**Benefits:**
- Contextual referrals
- Achievement-based rewards
- Better user experience

**Implementation:**
- Referral rewards for course completion
- Achievement-based bonuses
- Progress-based incentives
- Social learning features

### FE-8: Corporate Partnership Program

**Description:** Create program for corporate partners.

**Benefits:**
- B2B revenue
- Bulk enrollments
- Corporate training

**Implementation:**
- Corporate account management
- Bulk referral codes
- Volume-based pricing
- Corporate reporting

---

## Appendix

### A. Glossary

- **Commission:** Payment made to referrer for successful referral
- **Referral Code:** Unique code used to track referrals
- **Ambassador:** Official representative of AutoLearn Spot
- **Campus Ambassador:** Student representative on campus
- **Partner Ambassador:** Influencer or community leader
- **Holding Period:** Time before commission becomes withdrawable
- **Withdrawal:** Request to transfer earnings to bank account
- **Self-Referral:** Referring oneself (prohibited)
- **Conversion:** When a referred student completes payment
- **Attribution:** Assigning a referral to a referrer

### B. Reference Tables

#### Commission Rates

| Referrer Type | Commission Amount |
|--------------|-------------------|
| Student Referrer | ₦1,000 |
| Campus Ambassador | ₦1,000 |
| Partner Ambassador | ₦2,000 |

#### Status Definitions

**Commission Status:**
- pending: Created but within holding period
- available: Past holding period, ready for withdrawal
- withdrawing: Included in withdrawal request
- paid: Successfully paid to referrer
- reversed: Reversed due to fraud/payment reversal

**Withdrawal Status:**
- pending: Submitted by referrer, awaiting admin review
- approved: Approved by admin, awaiting payment
- paid: Payment processed by admin
- rejected: Rejected by admin, funds returned

**Ambassador Status:**
- pending: Invited but not yet accepted
- active: Active and earning commissions
- suspended: Temporarily suspended due to issues
- inactive: No longer active

**Fraud Alert Status:**
- open: New alert, not yet reviewed
- investigating: Under review by admin
- resolved: Issue resolved
- false_positive: Legitimate activity, not fraud

### C. System Constraints

**Technical Constraints:**
- Must use existing Supabase database
- Must use existing Clerk authentication
- Must use existing Paystack integration
- Must use existing notification system
- Must follow existing code patterns

**Business Constraints:**
- Fixed course price (₦5,000)
- No referral discounts
- Commission amounts fixed
- 7-day holding period
- Minimum withdrawal (₦2,000)

**Regulatory Constraints:**
- GDPR compliance
- Data privacy regulations
- Financial regulations
- Anti-money laundering (AML)

### D. Assumptions

**Technical Assumptions:**
- Existing systems stable and scalable
- Paystack webhooks reliable
- Database can handle growth
- Clerk authentication continues

**Business Assumptions:**
- ₦5,000 price point sustainable
- Commission amounts viable
- Referral program attractive
- Ambassador program feasible

**User Assumptions:**
- Students willing to refer
- Ambassadors motivated
- Withdrawal process acceptable
- Fraud attempts manageable

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-01 | Lead Architect | Initial SRS |

**Reviewers:**
- [ ] Product Manager
- [ ] Tech Lead
- [ ] DevOps Engineer
- [ ] Security Engineer
- [ ] QA Lead

**Approval:**
- [ ] Approved for Implementation
- [ ] Approved with Changes
- [ ] Rejected

---

**End of Document**
