import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Paystack secret key for webhook verification
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    if (PAYSTACK_SECRET_KEY) {
      const hmac = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('[Paystack Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log('[Paystack Webhook] Received event:', event.event);

    // Handle payment success
    if (event.event === 'charge.success' || event.event === 'transaction.success') {
      const { data } = event;
      const { metadata, amount, email, customer, reference } = data;

      console.log('[Paystack Webhook] Payment successful:', { email, amount, reference, metadata });

      // Handle scholarship payment
      if (metadata?.flow === 'scholarship') {
        console.log('[Paystack Webhook] Processing scholarship payment');
        await handleScholarshipPayment(data);
      }
      // Handle direct enrollment payment
      else if (metadata?.flow === 'direct-enrollment') {
        console.log('[Paystack Webhook] Processing direct enrollment payment');
        await handleDirectEnrollmentPayment(data);
      }
      // Handle payment with pending_id (enrollment flow)
      else if (metadata?.pending_id) {
        console.log('[Paystack Webhook] Processing enrollment payment with pending_id');
        await handleEnrollmentPayment(data);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleEnrollmentPayment(data: any) {
  const { metadata, email, customer, reference, amount } = data;
  const { pending_id, fullName, phone, referralCode } = metadata;

  console.log('[Paystack Webhook] Processing enrollment payment for pending_id:', pending_id);

  try {
    // Get pending enrollment
    const { data: pendingEnrollment } = await supabaseAdmin
      .from('pending_enrollments')
      .select('*')
      .eq('id', pending_id)
      .single();

    if (!pendingEnrollment) {
      console.error('[Paystack Webhook] Pending enrollment not found:', pending_id);
      return;
    }

    // Create confirmed enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        full_name: pendingEnrollment.full_name,
        email: pendingEnrollment.email,
        phone_number: pendingEnrollment.phone_number,
        whatsapp_number: pendingEnrollment.whatsapp_number,
        state: pendingEnrollment.state,
        occupation: pendingEnrollment.occupation,
        gender: pendingEnrollment.gender,
        referral_source: pendingEnrollment.referral_source,
        referral_code: pendingEnrollment.referral_code,
        payment_reference: reference,
        payment_amount: amount,
        payment_status: 'successful',
        enrollment_status: 'confirmed',
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('[Paystack Webhook] Failed to create enrollment:', enrollmentError);
      return;
    }

    console.log('[Paystack Webhook] Enrollment created:', enrollment.id);

    // Update pending enrollment status
    await supabaseAdmin
      .from('pending_enrollments')
      .update({ status: 'confirmed', enrollment_id: enrollment.id })
      .eq('id', pending_id);

    // Create student partner account for dashboard access
    try {
      // Get or create Clerk user (this would typically be done via Clerk webhooks)
      // For now, we'll create a partner record linked to the enrollment
      const partnerResult = await PartnerService.createStudentPartner(
        enrollment.id, // Using enrollment ID as user identifier
        enrollment.email,
        enrollment.full_name
      );

      if (partnerResult.success) {
        console.log('[Paystack Webhook] Student partner created:', partnerResult.partner?.id);
        
        // Link partner to enrollment
        await supabaseAdmin
          .from('enrollments')
          .update({ partner_id: partnerResult.partner?.id })
          .eq('id', enrollment.id);
      }
    } catch (e) {
      console.error('[Paystack Webhook] Failed to create student partner:', e);
    }

    // Handle referral code if provided
    if (referralCode) {
      try {
        const { data: referral } = await supabaseAdmin
          .from('partner_referrals')
          .select('*')
          .eq('referral_code', referralCode)
          .single();

        if (referral) {
          await supabaseAdmin
            .from('partner_referrals')
            .update({
              total_registrations: (referral.total_registrations || 0) + 1,
              status: 'conversion'
            })
            .eq('id', referral.id);

          console.log('[Paystack Webhook] Referral updated:', referralCode);
        }
      } catch (e) {
        console.error('[Paystack Webhook] Failed to update referral:', e);
      }
    }

    // Send confirmation with WhatsApp group link
    await sendEnrollmentConfirmation(enrollment);

    // Send notification to founder
    await sendFounderNotification(enrollment);

    await logReferralEvent({
      action: 'enrollment_confirmed',
      category: 'enrollment',
      user_id: enrollment.id,
      description: `Student ${enrollment.full_name} enrolled successfully`,
      metadata: { 
        enrollmentId: enrollment.id, 
        email: enrollment.email,
        amount,
        reference,
        referralCode
      }
    });

  } catch (error) {
    console.error('[Paystack Webhook] Error processing enrollment payment:', error);
  }
}

async function handleScholarshipPayment(data: any) {
  console.log('[Paystack Webhook] Processing scholarship payment - implementation needed');
  // Scholarship payment handling would go here
}

async function handleDirectEnrollmentPayment(data: any) {
  console.log('[Paystack Webhook] Processing direct enrollment payment - implementation needed');
  // Direct enrollment payment handling would go here
}

async function sendEnrollmentConfirmation(enrollment: any) {
  console.log('[Paystack Webhook] Sending enrollment confirmation to:', enrollment.email);
  
  try {
    // Send email confirmation with WhatsApp group link
    const { data: emailResult } = await supabaseAdmin
      .from('email_queue')
      .insert({
        to: enrollment.email,
        subject: 'Welcome to AutoLearn Spot - Your Enrollment is Confirmed!',
        body: `
          <h1>Welcome to AutoLearn Spot!</h1>
          <p>Dear ${enrollment.full_name},</p>
          <p>Congratulations! Your enrollment has been successfully confirmed.</p>
          <p><strong>Course Details:</strong></p>
          <ul>
            <li>4-week hands-on n8n automation training</li>
            <li>Duration: ${new Date().toLocaleDateString()} to ${new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
            <li>Investment: ₦8,000</li>
          </ul>
          <p><strong>Next Steps:</strong></p>
          <p>Join our WhatsApp community group for announcements, support, and networking:</p>
          <p><a href="${process.env.WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/your-group-link'}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0;">Join WhatsApp Group</a></p>
          <p>Your login credentials will be sent shortly.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>AutoLearn Spot Team</p>
        `,
        status: 'pending',
        type: 'enrollment_confirmation'
      })
      .select()
      .single();

    console.log('[Paystack Webhook] Email queued:', emailResult?.id);
  } catch (error) {
    console.error('[Paystack Webhook] Failed to queue enrollment confirmation email:', error);
  }
}

async function sendFounderNotification(enrollment: any) {
  console.log('[Paystack Webhook] Sending founder notification for:', enrollment.email);
  
  try {
    // Send notification to founder
    const { data: emailResult } = await supabaseAdmin
      .from('email_queue')
      .insert({
        to: process.env.FOUNDER_EMAIL || 'femiadeleke2020@gmail.com',
        subject: `New Enrollment: ${enrollment.full_name}`,
        body: `
          <h1>New Student Enrollment</h1>
          <p>A new student has enrolled in the AutoLearn Spot automation course.</p>
          <p><strong>Student Details:</strong></p>
          <ul>
            <li>Name: ${enrollment.full_name}</li>
            <li>Email: ${enrollment.email}</li>
            <li>Phone: ${enrollment.phone_number}</li>
            <li>WhatsApp: ${enrollment.whatsapp_number}</li>
            <li>State: ${enrollment.state}</li>
            <li>Occupation: ${enrollment.occupation}</li>
            <li>Gender: ${enrollment.gender}</li>
            <li>Referral Code: ${enrollment.referral_code || 'None'}</li>
            <li>Referral Source: ${enrollment.referral_source}</li>
          </ul>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Amount: ₦${enrollment.payment_amount}</li>
            <li>Reference: ${enrollment.payment_reference}</li>
            <li>Status: ${enrollment.payment_status}</li>
            <li>Enrolled At: ${new Date(enrollment.enrolled_at).toLocaleString()}</li>
          </ul>
          <p><strong>Enrollment ID:</strong> ${enrollment.id}</p>
          <p>Please ensure to add the student to the WhatsApp group and provide dashboard access.</p>
          <p>Best regards,<br>AutoLearn Spot System</p>
        `,
        status: 'pending',
        type: 'founder_notification'
      })
      .select()
      .single();

    console.log('[Paystack Webhook] Founder notification queued:', emailResult?.id);
  } catch (error) {
    console.error('[Paystack Webhook] Failed to queue founder notification email:', error);
  }
}