import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getFlowFromAmount, validatePaymentAmount } from '@/config/payment';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { NotificationService } from '@/lib/growth-engine/NotificationService';
import { FounderEmailService } from '@/lib/growth-engine/FounderEmailService';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';
import { logUserActivity } from '@/lib/audit-logging';
import { PartnerReferralService } from '@/lib/partner-system/PartnerReferralService';
import { PartnerCommissionService } from '@/lib/partner-system/PartnerCommissionService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Paystack webhook secret for Direct Enrollment
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_DIRECT_ENROLLMENT_WEBHOOK_SECRET || '';

/**
 * Verify Paystack webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.warn('Paystack webhook secret not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

/**
 * Generate a unique referral code for a new student
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get referrer name by ID
 */
async function getReferrerName(referrerId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('partners')
      .select('user_name')
      .eq('id', referrerId)
      .single();
    return data?.user_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature || '')) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Only handle successful payment events
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const data = event.data;
    const amount = data.amount; // Amount in kobo (divide by 100 for Naira)
    const amountInNaira = amount / 100;
    const email = data.customer.email;
    const reference = data.reference;
    const pendingId = data.metadata?.pending_id;

    // Verify this is a Direct Enrollment payment (₦8,000)
    if (!validatePaymentAmount(amountInNaira, 'direct-enrollment')) {
      console.error(`Invalid payment amount for Direct Enrollment: ₦${amountInNaira}`);
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    // Check if this payment has already been processed (idempotency)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('payment_ref', reference)
      .maybeSingle();

    if (existingEnrollment) {
      console.log(`Payment ${reference} already processed - enrollment exists`);
      return NextResponse.json({ received: true, message: 'Payment already processed' });
    }

    // Find the pending enrollment
    let pendingEnrollment;
    if (pendingId) {
      const { data: pending } = await supabaseAdmin
        .from('pending_enrollments')
        .select('*')
        .eq('id', pendingId)
        .single();
      pendingEnrollment = pending;
    } else {
      // Fallback: find by email if pending_id not provided
      const { data: pending } = await supabaseAdmin
        .from('pending_enrollments')
        .select('*')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      pendingEnrollment = pending;
    }

    if (!pendingEnrollment) {
      console.error(`No pending enrollment found for email: ${email}`);
      return NextResponse.json({ error: 'No pending enrollment found' }, { status: 404 });
    }

    // Note: We do NOT reject expired pending enrollments
    // A successful Paystack payment should be honored regardless of when the pending enrollment was created
    // The expires_at is for cleanup of abandoned registrations, not for rejecting successful payments
    // 
    // RECOVERY: For expired but successfully paid pending enrollments (e.g., T220202238424485):
    // - The pending enrollment record still exists with payment_status = 'pending'
    // - Re-triggering the Paystack webhook (via Paystack Dashboard retry or manual trigger) will:
    //   1. Find the pending enrollment by pending_id (even if expired)
    //   2. Create the enrollment using current cohort
    //   3. Mark pending enrollment as completed with payment_reference
    // - No manual database intervention required

    // Resolve current cohort
    console.info('DIRECT ENROLLMENT: Resolving current cohort');
    const { data: currentCohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, status, is_current')
      .eq('is_current', true)
      .single();

    if (cohortError) {
      console.error('DIRECT ENROLLMENT: Cohort resolution error', {
        code: cohortError.code,
        message: cohortError.message,
        details: cohortError.details,
        hint: cohortError.hint
      });
      return NextResponse.json(
        { error: 'Failed to resolve current cohort' },
        { status: 500 }
      );
    }

    if (!currentCohort) {
      console.error('DIRECT ENROLLMENT: No current cohort found');
      return NextResponse.json(
        { error: 'No active cohort found. Please activate a cohort before processing payments.' },
        { status: 400 }
      );
    }

    console.info('DIRECT ENROLLMENT: Current cohort resolved', {
      cohort_id: currentCohort.id,
      cohort_name: currentCohort.name,
      status: currentCohort.status,
      is_current: currentCohort.is_current
    });

    // Create final enrollment
    console.info('DIRECT ENROLLMENT: Creating enrollment', {
      cohort_id: currentCohort.id,
      email: pendingEnrollment.email,
      payment_ref: reference,
      amount_paid: amountInNaira
    });

    const enrollmentData = {
      cohort_id: currentCohort.id,
      email: pendingEnrollment.email,
      payment_ref: reference,
      amount_paid: amountInNaira,
      status: 'active',
      activated_at: new Date().toISOString(),
      referral_code: pendingEnrollment.referral_code || null,
      referred_by_code: pendingEnrollment.referral_code || null
    };

    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollmentData, {
        onConflict: 'cohort_id, email'
      });

    if (enrollmentError) {
      console.error('DIRECT ENROLLMENT: Enrollment creation error', {
        cohort_id: currentCohort.id,
        email: pendingEnrollment.email,
        payment_ref: reference,
        amount: amountInNaira,
        code: enrollmentError.code,
        message: enrollmentError.message,
        details: enrollmentError.details,
        hint: enrollmentError.hint
      });
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    console.info('DIRECT ENROLLMENT: Enrollment created successfully');

    // Send admin notification about successful payment
    await AdminEmailService.sendStudentPaymentEmail({
      fullName: pendingEnrollment.full_name,
      email: pendingEnrollment.email,
      phoneNumber: pendingEnrollment.phone_number,
      paymentAmount: amountInNaira,
      paymentReference: reference,
      cohort: 'Cohort 2'
    });

    // Create Student Partner (automatic for Direct Enrollment)
    // First create a referral code for this student
    const referralCode = generateReferralCode();
    const { data: newReferralCode, error: referralError } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        owner_id: pendingEnrollment.email, // Use email as owner_id since we use Clerk
        code: referralCode,
        status: 'Active',
        owner_type: 'student'
      })
      .select('id')
      .single();

    if (referralError) {
      console.error('Error creating referral code:', referralError);
      // Continue anyway, partner creation can still work without referral code
    }

    // Now create the partner record
    const { data: studentPartner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert({
        user_id: pendingEnrollment.email, // Use email as user_id since we use Clerk
        user_email: pendingEnrollment.email,
        user_name: pendingEnrollment.full_name,
        partner_type: 'student',
        referral_code_id: newReferralCode?.id || null,
        commission_rate: 1500, // Student partner commission
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (partnerError) {
      console.error('Error creating student partner:', partnerError);
      // Continue anyway, user creation was successful
    }

    // Handle referral commission if applicable
    if (pendingEnrollment.referred_by && pendingEnrollment.referral_code) {
      try {
        // Existing commission system
        await CommissionService.createCommission({
          referrerId: pendingEnrollment.referred_by,
          refereeEmail: pendingEnrollment.email,
          referralCode: pendingEnrollment.referral_code,
          paymentReference: reference,
          courseAmount: amountInNaira,
          paymentType: 'direct-enrollment',
        });

        // Track the referral conversion
        await ReferralService.trackConversion({
          referralCode: pendingEnrollment.referral_code,
          refereeEmail: pendingEnrollment.email,
          paymentAmount: amountInNaira,
          paymentReference: reference,
        });

        // New partner commission system integration
        const { data: partnerReferral } = await supabaseAdmin
          .from('partner_referrals')
          .select('id, partner_id')
          .eq('referral_code', pendingEnrollment.referral_code)
          .single();

        if (partnerReferral) {
          await PartnerReferralService.recordReferralEnrollment(
            pendingEnrollment.referral_code,
            pendingEnrollment.email,
            amountInNaira
          );

          await PartnerCommissionService.createCommission(
            partnerReferral.partner_id,
            partnerReferral.id,
            pendingEnrollment.email,
            amountInNaira
          );

          // Send email notification to partner about successful referral
          const { data: partnerData } = await supabaseAdmin
            .from('partners')
            .select('user_name, user_email')
            .eq('id', partnerReferral.partner_id)
            .single();

          if (partnerData) {
            await AdminEmailService.sendPartnerReferralEmail({
              partnerName: partnerData.user_name,
              partnerEmail: partnerData.user_email,
              refereeEmail: pendingEnrollment.email,
              commissionAmount: 1500,
              referralCode: pendingEnrollment.referral_code
            });
          }
        }
      } catch (commissionError) {
        console.error('Error creating commission:', commissionError);
        // Continue anyway, user creation was successful
      }
    }

    // Send welcome email
    try {
      await PartnerEmailService.sendWelcomeEmail({
        email: pendingEnrollment.email,
        fullName: pendingEnrollment.full_name,
        referralCode: referralCode,
        enrollmentType: 'Direct Enrollment',
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue anyway
    }

    // Create in-app notification
    try {
      await NotificationService.createNotification({
        partnerId: studentPartner?.id || null,
        type: 'enrollment_complete',
        title: 'Welcome to AutoLearn Spot!',
        message: 'Your enrollment is complete. You now have access to your dashboard.',
        metadata: {
          enrollmentType: 'direct',
          paymentAmount: amountInNaira,
          referralCode: referralCode,
        },
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue anyway
    }

    // Notify founder of new registration
    try {
      await FounderEmailService.sendNewRegistration({
        name: pendingEnrollment.full_name,
        email: pendingEnrollment.email,
        phone: pendingEnrollment.phone_number,
        registrationType: 'direct_enrollment',
        referralCode: pendingEnrollment.referral_code || undefined,
        referrer: pendingEnrollment.referred_by ? await getReferrerName(pendingEnrollment.referred_by) : undefined,
      });
    } catch (founderEmailError) {
      console.error('Error sending founder notification:', founderEmailError);
      // Continue anyway
    }

    // Notify founder of payment received
    try {
      await FounderEmailService.sendPaymentReceived({
        studentName: pendingEnrollment.full_name,
        email: pendingEnrollment.email,
        amount: amountInNaira,
        paymentType: 'direct_enrollment',
        reference: reference,
        referrer: pendingEnrollment.referred_by ? await getReferrerName(pendingEnrollment.referred_by) : undefined,
        commissionGenerated: pendingEnrollment.referred_by ? 1500 : undefined,
      });
    } catch (founderPaymentError) {
      console.error('Error sending payment notification:', founderPaymentError);
      // Continue anyway
    }

    // Log the enrollment activity
    try {
      await logUserActivity({
        action: 'direct_enrollment_completed',
        user_id: pendingEnrollment.email,
        user_email: pendingEnrollment.email,
        description: `Direct enrollment completed for ₦${amountInNaira}`,
        metadata: {
          paymentReference: reference,
          referralCode: pendingEnrollment.referral_code,
          referredBy: pendingEnrollment.referred_by,
        },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Continue anyway
    }

    // Update pending enrollment to completed
    await supabaseAdmin
      .from('pending_enrollments')
      .update({
        payment_status: 'completed',
        payment_reference: reference,
        completed_at: new Date().toISOString(),
      })
      .eq('id', pendingEnrollment.id);

    return NextResponse.json({
      received: true,
      message: 'Direct enrollment processed successfully',
      enrollmentEmail: pendingEnrollment.email,
      referralCode: referralCode,
    });

  } catch (error) {
    console.error('Error in Direct Enrollment webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}