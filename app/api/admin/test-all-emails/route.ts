import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import {
  sendApplicationReceivedEmail,
  sendUnderReviewEmail,
  sendAcceptedEmail,
  sendWelcomeEmail,
} from '@/lib/scholarship-emails';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleTest(req);
}

export async function POST(req: NextRequest) {
  return handleTest(req);
}

async function handleTest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  let targetEmail = searchParams.get('email') || 'femiadeleke2020@gmail.com';
  let eventType = searchParams.get('event'); // optional: test single event

  // Simple security check: secret param or admin session
  if (secret !== 'autolearn_test_2026') {
    // If no secret, try checking json body if POST
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.secret === 'autolearn_test_2026') {
          if (body.email) targetEmail = body.email;
          if (body.event) eventType = body.event;
        } else {
          return NextResponse.json({ error: 'Unauthorized: Invalid test secret' }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: 'Unauthorized: Invalid test secret' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized: Invalid test secret' }, { status: 401 });
    }
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  const tests: Record<string, () => Promise<any>> = {
    // 1. Marketplace Purchase (Student)
    course_purchase_confirmation: async () => {
      return await EmailService.sendCoursePurchaseConfirmation(
        targetEmail,
        'Femi Adeleke (Test Student)',
        'AI Automation with n8n (Production Masterclass)',
        3000,
        'TEST_PURCHASE_REF_987654'
      );
    },

    // 2. Marketplace Sale (Author)
    course_sale_notification: async () => {
      return await EmailService.sendCourseSaleNotification(
        targetEmail,
        'Femi Adeleke',
        'AI Automation with n8n',
        'student.test@example.com',
        3000,
        2700
      );
    },

    // 3. Affiliate Partner Commission
    partner_commission_earned: async () => {
      return await PartnerEmailService.sendCommissionEarnedEmail(
        targetEmail,
        'Femi Adeleke (Partner)',
        600,
        'referred.student@example.com'
      );
    },

    // 4. Partner Application Approved
    partner_approved: async () => {
      return await PartnerEmailService.sendApplicationApprovedEmail(
        targetEmail,
        'Femi Adeleke',
        'AutoLearn2026!',
        'https://www.autolearnspot.com/login',
        'https://www.autolearnspot.com/partners/dashboard',
        20
      );
    },

    // 5. Scholarship Application Received
    scholarship_application_received: async () => {
      await sendApplicationReceivedEmail({
        to: targetEmail,
        fullName: 'Femi Adeleke',
        referenceNumber: 'SCH-2026-TEST-001',
      });
      return true;
    },

    // 6. Scholarship Accepted
    scholarship_accepted: async () => {
      await sendAcceptedEmail({
        to: targetEmail,
        fullName: 'Femi Adeleke',
        referenceNumber: 'SCH-2026-TEST-001',
      });
      return true;
    },

    // 7. Scholarship Welcome & Payment Verified
    scholarship_welcome: async () => {
      await sendWelcomeEmail({
        to: targetEmail,
        fullName: 'Femi Adeleke',
        referenceNumber: 'SCH-2026-TEST-001',
      });
      return true;
    },

    // 8. Author Application Approved
    author_approved: async () => {
      return await EmailService.sendApplicationApproved(
        targetEmail,
        'Femi Adeleke',
        'https://www.autolearnspot.com/login'
      );
    },

    // 9. Student Quiz Completed
    quiz_completed: async () => {
      return await EmailService.sendQuizCompletionNotification(
        targetEmail,
        'Femi Adeleke',
        'AI Automation with n8n: Module 1 Assessment',
        100,
        80
      );
    },

    // 10. Student Course Completed & Certificate
    course_completed: async () => {
      return await EmailService.sendCourseCompletionNotification(
        targetEmail,
        'Femi Adeleke',
        'AI Automation with n8n',
        targetEmail,
        'Femi Adeleke'
      );
    },

    // 11. Withdrawal Paid
    withdrawal_paid: async () => {
      return await PartnerEmailService.sendWithdrawalPaidEmail(
        targetEmail,
        'Femi Adeleke',
        50000,
        'TRF_TEST_REF_20261107'
      );
    },
  };

  const keysToRun = eventType && tests[eventType] ? [eventType] : Object.keys(tests);

  for (const key of keysToRun) {
    try {
      const res = await tests[key]();
      results[key] = { success: res !== false };
    } catch (err: any) {
      console.error(`[TestEmails] Failed for ${key}:`, err);
      results[key] = { success: false, error: err.message || String(err) };
    }
  }

  const successCount = Object.values(results).filter((r) => r.success).length;
  const failureCount = Object.values(results).length - successCount;

  return NextResponse.json({
    status: failureCount === 0 ? 'success' : 'partial',
    targetEmail,
    totalTested: keysToRun.length,
    successCount,
    failureCount,
    results,
  });
}
