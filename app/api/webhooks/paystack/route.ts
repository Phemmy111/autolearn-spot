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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use test or live webhook secret based on paystackMode
const webhookSecret = scholarshipConfig.paystackMode === 'test' 
  ? process.env.PAYSTACK_TEST_WEBHOOK_SECRET!
  : process.env.PAYSTACK_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

      console.log('Payment successful:', { reference, customerEmail, amount });

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

        if (currentCohort) {
          const enrollmentData: any = {
            cohort_id: currentCohort.id,
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

            // Growth Engine M3: Create commission for referrer (idempotent)
            try {
              await CommissionService.createCommission({
                paymentReference: reference,
                referralCode: application.referred_by_code,
                refereeEmail: customerEmail,
              });
            } catch (commissionErr) {
              console.error('Failed to create commission:', commissionErr);
              // Don't fail the webhook if commission creation fails
            }
          }

          console.log('Enrollment created/updated for:', application.email);
        }
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
