import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/scholarship-emails';
import { scholarshipConfig } from '@/config/scholarship';
import { 
  logPaymentEvent, 
  logScholarshipTimeline, 
  logSystemError,
  logEmailEvent 
} from '@/lib/audit-logging';
import { createNotification } from '@/lib/notifications';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { NotificationService as PartnerNotificationService } from '@/lib/growth-engine/NotificationService';
import { FounderEmailService } from '@/lib/growth-engine/FounderEmailService';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';
import { logUserActivity } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use test or live webhook secret based on paystackMode
const webhookSecret = scholarshipConfig.paystackMode === 'test' 
  ? process.env.PAYSTACK_TEST_WEBHOOK_SECRET!
  : process.env.PAYSTACK_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

/**
 * Process Direct Enrollment payment flow
 * This handles Direct Enrollment transactions with configurable pricing
 */
async function processDirectEnrollment(data: any, reference: string, amountInNaira: number, pendingId: string) {
  const email = data.customer.email;

  // Find the pending enrollment first to get the expected amount
  let pendingEnrollment;
  const { data: pending } = await supabaseAdmin
    .from('pending_enrollments')
    .select('*')
    .eq('id', pendingId)
    .single();
  pendingEnrollment = pending;

  if (!pendingEnrollment) {
    console.error(`No pending enrollment found for pending_id: ${pendingId}`);
    await logPaymentEvent({
      action: 'payment_verification_failed',
      category: 'payment_verified',
      user_email: email,
      payment_reference: reference,
      amount: amountInNaira,
      description: 'Pending enrollment not found',
      status: 'failure',
      error_message: `No pending enrollment with id: ${pendingId}`
    });
    return NextResponse.json({ error: 'No pending enrollment found' }, { status: 404 });
  }

  // Verify payment amount matches the pending enrollment's stored amount
  // This ensures backward compatibility - old pending enrollments keep their original price
  const expectedAmount = pendingEnrollment.payment_amount || 8000; // Fallback to 8000 if not set
  if (amountInNaira !== expectedAmount) {
    console.error(`Payment amount mismatch for Direct Enrollment: expected ₦${expectedAmount}, got ₦${amountInNaira}`);
    await logPaymentEvent({
      action: 'payment_validation_failed',
      category: 'payment_verified',
      user_email: email,
      payment_reference: reference,
      amount: amountInNaira,
      description: 'Payment amount does not match pending enrollment amount',
      status: 'failure',
      error_message: `Expected ₦${expectedAmount}, got ₦${amountInNaira}`
    });
    return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
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

  // Note: We do NOT reject expired pending enrollments
  // A successful Paystack payment should be honored regardless of when the pending enrollment was created
  // The expires_at is for cleanup of abandoned registrations, not for rejecting successful payments
  // 
  // RECOVERY: For expired but successfully paid pending enrollments:
  // - The pending enrollment record still exists with payment_status = 'pending'
  // - Re-triggering the Paystack webhook will:
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
    await logPaymentEvent({
      action: 'cohort_resolution_failed',
      category: 'payment_verified',
      user_email: email,
      payment_reference: reference,
      amount: amountInNaira,
      description: 'Failed to resolve current cohort',
      status: 'failure',
      error_message: cohortError.message
    });
    return NextResponse.json(
      { error: 'Failed to resolve current cohort' },
      { status: 500 }
    );
  }

  if (!currentCohort) {
    console.error('DIRECT ENROLLMENT: No current cohort found');
    await logPaymentEvent({
      action: 'cohort_resolution_failed',
      category: 'payment_verified',
      user_email: email,
      payment_reference: reference,
      amount: amountInNaira,
      description: 'No active cohort found',
      status: 'failure',
      error_message: 'No cohort with is_current = true'
    });
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
    await logPaymentEvent({
      action: 'enrollment_creation_failed',
      category: 'payment_verified',
      user_email: email,
      payment_reference: reference,
      amount: amountInNaira,
      description: 'Failed to create enrollment',
      status: 'failure',
      error_message: enrollmentError.message
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
    cohort: currentCohort.name
  });

  // Create Student Partner (automatic for Direct Enrollment)
  // Use the clerk_user_id from pending_enrollment if available, otherwise use email
  const clerkUserId = pendingEnrollment.clerk_user_id || pendingEnrollment.email;
  
  const partnerResult = await PartnerService.createStudentPartner(
    clerkUserId, // Use actual Clerk user ID
    pendingEnrollment.email,
    pendingEnrollment.full_name
  );

  const studentPartner = partnerResult.partner;

  if (partnerResult.success) {
    console.log('DIRECT ENROLLMENT: Student partner created successfully', {
      partnerId: studentPartner?.id,
      clerkUserId: clerkUserId,
      email: pendingEnrollment.email
    });
  } else {
    console.error('DIRECT ENROLLMENT: Failed to create student partner', {
      error: partnerResult.error,
      clerkUserId: clerkUserId,
      email: pendingEnrollment.email
    });
    // Continue anyway, enrollment was successful
  }

  // Handle referral commission if applicable
  if (pendingEnrollment.referred_by_code) {
    try {
      // Validate the referral code and get partner info
      const validation = await ReferralService.validateAndAttribute(
        pendingEnrollment.referred_by_code,
        pendingEnrollment.email
      );

      if (validation.valid && validation.owner_id) {
        // Get IP address for fraud detection
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';

        // Create commission using the owner_id from referral_codes (this is partner.id UUID)
        // Get the partner's details for the commission
        const { data: partner } = await supabaseAdmin
          .from('partners')
          .select('clerk_user_id, partner_type')
          .eq('id', validation.owner_id)
          .single();

        if (partner) {
          // Use clerk_user_id for student partners, partner.id for community/influencer
          const referrerId = partner.partner_type === 'student' && partner.clerk_user_id 
            ? partner.clerk_user_id 
            : validation.owner_id;

          const commissionResult = await CommissionService.recordCommission({
            referrerId: referrerId,
            referrerType: partner.partner_type as 'student' | 'community' | 'influencer',
            refereeEmail: pendingEnrollment.email,
            referralCode: pendingEnrollment.referred_by_code,
            paymentReference: reference,
            courseAmount: amountInNaira,
            ipAddress: ipAddress
          });

          if (commissionResult.success) {
            console.log('DIRECT ENROLLMENT: Commission created successfully for referral', {
              referrerId: referrerId,
              referrerType: partner.partner_type
            });
          } else {
            console.error('DIRECT ENROLLMENT: Commission creation failed:', commissionResult.error);
          }

          // Track the referral conversion in referral_codes table
          await ReferralService.trackConversion({
            referralCode: pendingEnrollment.referred_by_code,
            refereeEmail: pendingEnrollment.email,
            paymentAmount: amountInNaira,
            paymentReference: reference,
          });
        } else {
          console.error('DIRECT ENROLLMENT: Partner not found for referral', {
            owner_id: validation.owner_id
          });
        }
      }
    } catch (error) {
      console.error('DIRECT ENROLLMENT: Error processing referral commission:', error);
      // Don't fail the entire enrollment if commission fails
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
    await PartnerNotificationService.createNotification({
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!signature) {
      await logSystemError({
        action: 'webhook_received',
        category: 'validation_error',
        error_message: 'Missing Paystack signature',
        ip_address: ipAddress,
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha512', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      await logSystemError({
        action: 'webhook_received',
        category: 'validation_error',
        error_message: 'Invalid Paystack signature',
        ip_address: ipAddress,
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Log webhook received
    await logPaymentEvent({
      action: 'webhook_received',
      category: 'webhook_received',
      payment_reference: event.data?.reference,
      description: `Paystack webhook received: ${event.event}`,
      metadata: { event_type: event.event },
      status: 'success',
    });

    // Handle successful payment event
    if (event.event === 'charge.success') {
      const { data } = event;
      const customerEmail = data.customer.email;
      const reference = data.reference;
      const amount = data.amount;
      const amountInNaira = amount / 100;
      const paymentType = data.metadata?.payment_type;
      const pendingId = data.metadata?.pending_id;

      console.log('Payment successful:', { reference, customerEmail, amount, paymentType });

      // ROUTING: Determine payment flow based on metadata
      // Direct Enrollment transactions include payment_type in metadata
      // Scholarship transactions do not have this metadata field
      if (paymentType === 'direct_enrollment') {
        console.log('DIRECT ENROLLMENT: Processing via Direct Enrollment flow', { reference, pendingId });
        await logPaymentEvent({
          action: 'payment_flow_routed',
          category: 'webhook_received',
          payment_reference: reference,
          description: 'Routed to Direct Enrollment flow (payment_type = direct_enrollment in metadata)',
          status: 'success',
          metadata: { flow: 'direct-enrollment', payment_type: paymentType, pending_id: pendingId }
        });

        // Process Direct Enrollment flow
        return await processDirectEnrollment(data, reference, amountInNaira, pendingId);
      }

      console.log('SCHOLARSHIP: Processing via Scholarship flow', { reference });
      await logPaymentEvent({
        action: 'payment_flow_routed',
        category: 'webhook_received',
        payment_reference: reference,
        description: 'Routed to Scholarship flow (no payment_type in metadata or not direct_enrollment)',
        status: 'success',
        metadata: { flow: 'scholarship', payment_type: paymentType }
      });

      // Process Scholarship flow (existing logic below)

      // Find scholarship application by email
      const { data: application, error: fetchError } = await supabaseAdmin
        .from('scholarship_applications')
        .select('id, full_name, reference_number, email, status, payment_status, referred_by_code')
        .eq('email', customerEmail)
        .eq('status', 'Accepted')
        .single();

      if (fetchError || !application) {
        console.error('Application not found for email:', customerEmail);
        
        await logPaymentEvent({
          action: 'payment_verification_failed',
          category: 'payment_verified',
          user_email: customerEmail,
          payment_reference: reference,
          amount: amount / 100,
          description: 'Application not found for payment verification',
          status: 'failure',
          error_message: 'Application not found',
        });
        
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Check if payment is already verified
      if (application.payment_status === 'Verified') {
        console.log('Payment already verified for:', customerEmail);
        
        await logPaymentEvent({
          action: 'payment_already_verified',
          category: 'payment_verified',
          user_email: customerEmail,
          application_id: application.id,
          reference_number: application.reference_number,
          payment_reference: reference,
          amount: amount / 100,
          description: 'Payment already verified, resending welcome email',
          status: 'success',
        });
        
        // Still send welcome email even if already verified
        try {
          await sendWelcomeEmail({
            to: application.email,
            fullName: application.full_name,
            referenceNumber: application.reference_number,
          });
          console.log('Welcome email sent to:', customerEmail);
          
          await logEmailEvent({
            action: 'welcome_email',
            recipient_email: application.email,
            email_type: 'welcome',
            subject: 'Welcome to AutoLearn Spot',
            description: `Welcome email sent to ${application.email} (payment already verified)`,
            status: 'success',
          });
        } catch (emailError: any) {
          console.error('Failed to send welcome email:', emailError);
          
          await logEmailEvent({
            action: 'welcome_email',
            recipient_email: application.email,
            email_type: 'welcome',
            subject: 'Welcome to AutoLearn Spot',
            description: `Failed to send welcome email to ${application.email}`,
            status: 'failure',
            error_message: emailError.message,
          });
        }
        return NextResponse.json({ message: 'Payment already verified, welcome email sent' }, { status: 200 });
      }

      // Update payment status to Verified
      const { error: updateError } = await supabaseAdmin
        .from('scholarship_applications')
        .update({
          payment_status: 'Verified',
          payment_date: new Date().toISOString(),
          payment_notes: `Paystack Reference: ${reference}, Amount: ₦${amount / 100}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (updateError) {
        console.error('Failed to update payment status:', updateError);
        
        await logPaymentEvent({
          action: 'payment_verification_failed',
          category: 'payment_verified',
          user_email: customerEmail,
          application_id: application.id,
          reference_number: application.reference_number,
          payment_reference: reference,
          amount: amount / 100,
          description: 'Failed to update payment status in database',
          status: 'failure',
          error_message: updateError.message,
        });
        
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }

      console.log('Payment status updated to Verified for:', customerEmail);

      // Log successful payment verification
      await logPaymentEvent({
        action: 'payment_verified',
        category: 'payment_verified',
        user_email: customerEmail,
        application_id: application.id,
        reference_number: application.reference_number,
        payment_reference: reference,
        amount: amount / 100,
        description: `Payment verified for ${application.full_name}`,
        status: 'success',
      });

      // Log timeline entry for payment verification
      await logScholarshipTimeline({
        application_id: application.id,
        reference_number: application.reference_number,
        from_status: application.payment_status,
        to_status: 'Verified',
        notes: `Payment verified via Paystack webhook. Reference: ${reference}`,
        reason: 'Payment verification',
      });

      // Create enrollment if not exists
      try {
        const { data: currentCohort } = await supabaseAdmin
          .from('cohorts')
          .select('id')
          .eq('is_current', true)
          .single();

        // Fallback to default cohort ID if no current cohort exists
        const cohortId = currentCohort?.id || 'a1111111-1111-1111-1111-111111111111';

        const enrollmentData: any = {
          cohort_id: cohortId,
          email: application.email,
          payment_ref: reference,
          amount_paid: amount,
          status: 'active',
          activated_at: new Date().toISOString()
        };

          // Add name fields from application
          if (application.full_name) {
            enrollmentData.full_name = application.full_name;
            const nameParts = application.full_name.split(' ');
            if (nameParts.length > 0) enrollmentData.first_name = nameParts[0];
            if (nameParts.length > 1) enrollmentData.last_name = nameParts.slice(1).join(' ');
          }

          // Growth Engine: carry over referral code
          if (application.referred_by_code) {
            enrollmentData.referred_by_code = application.referred_by_code;
          }

          await supabaseAdmin
            .from('enrollments')
            .upsert(enrollmentData, { onConflict: 'cohort_id, email' });

          // Growth Engine: Record successful registration for referrer
          if (application.referred_by_code) {
            try {
              const { data: currentRef } = await supabaseAdmin
                .from('referral_codes')
                .select('total_registrations')
                .eq('code', application.referred_by_code)
                .single();
                
              if (currentRef) {
                await supabaseAdmin
                  .from('referral_codes')
                  .update({ total_registrations: (currentRef.total_registrations || 0) + 1 })
                  .eq('code', application.referred_by_code);
              }
            } catch (err) {
              console.error('Failed to update referrer registration count:', err);
            }

            // Growth Engine M3/M9: Create commission for referrer (idempotent)
            try {
              const { data: refData } = await supabaseAdmin
                .from('referral_codes')
                .select('owner_id, owner_type')
                .eq('code', application.referred_by_code)
                .single();

              if (refData) {
                await CommissionService.recordCommission({
                  referrerId: refData.owner_id,
                  referrerType: refData.owner_type,
                  paymentReference: reference,
                  referralCode: application.referred_by_code,
                  refereeEmail: customerEmail,
                });
              }
            } catch (commissionErr) {
              console.error('Failed to create commission:', commissionErr);
              // Don't fail the webhook if commission creation fails
            }
          }

        console.log('Enrollment created/updated for:', application.email);
      } catch (enrollError) {
        console.error('Failed to create enrollment:', enrollError);
        // Don't fail the webhook if enrollment creation fails
      }

      // Create in-app notification for payment verification
      try {
        await createNotification({
          title: 'Payment Verified',
          message: 'Your scholarship payment has been verified successfully. Welcome to the programme!',
          category: 'payment',
          priority: 'urgent',
          target_type: 'student',
          target_id: application.email,
          action_url: '/dashboard',
          action_label: 'Go to Dashboard',
          send_email: false, // Email is sent separately
          event_id: `payment_verified_${reference}`,
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the webhook if notification fails
      }

      // Send welcome email
      try {
        await sendWelcomeEmail({
          to: application.email,
          fullName: application.full_name,
          referenceNumber: application.reference_number,
        });
        console.log('Welcome email sent to:', customerEmail);
        
        await logEmailEvent({
          action: 'welcome_email',
          recipient_email: application.email,
          email_type: 'welcome',
          subject: 'Welcome to AutoLearn Spot',
          description: `Welcome email sent to ${application.email}`,
          status: 'success',
        });
      } catch (emailError: any) {
        console.error('Failed to send welcome email:', emailError);
        
        await logEmailEvent({
          action: 'welcome_email',
          recipient_email: application.email,
          email_type: 'welcome',
          subject: 'Welcome to AutoLearn Spot',
          description: `Failed to send welcome email to ${application.email}`,
          status: 'failure',
          error_message: emailError.message,
        });
        // Don't fail the webhook if email fails
      }

      return NextResponse.json({ message: 'Payment verified and welcome email sent' }, { status: 200 });
    }

    // Handle other events
    console.log('Unhandled Paystack event:', event.event);
    return NextResponse.json({ message: 'Event received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
