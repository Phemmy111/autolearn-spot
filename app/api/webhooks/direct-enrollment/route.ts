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
      .select('full_name')
      .eq('id', referrerId)
      .single();
    return data?.full_name || 'Unknown';
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
    const { data: existingPayment } = await supabaseAdmin
      .from('pending_enrollments')
      .select('*')
      .eq('payment_reference', reference)
      .eq('payment_status', 'completed')
      .single();

    if (existingPayment) {
      console.log(`Payment ${reference} already processed`);
      return NextResponse.json({ received: true, message: 'Payment already processed' });
    }

    // Find the pending enrollment
    let pendingEnrollment;
    if (pendingId) {
      const { data: pending } = await supabaseAdmin
        .from('pending_enrollments')
        .select('*')
        .eq('id', pendingId)
        .eq('payment_status', 'pending')
        .single();
      pendingEnrollment = pending;
    } else {
      // Fallback: find by email if pending_id not provided
      const { data: pending } = await supabaseAdmin
        .from('pending_enrollments')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      pendingEnrollment = pending;
    }

    if (!pendingEnrollment) {
      console.error(`No pending enrollment found for email: ${email}`);
      return NextResponse.json({ error: 'No pending enrollment found' }, { status: 404 });
    }

    // Check if pending enrollment has expired
    if (new Date(pendingEnrollment.expires_at) < new Date()) {
      await supabaseAdmin
        .from('pending_enrollments')
        .update({ payment_status: 'expired' })
        .eq('id', pendingEnrollment.id);
      return NextResponse.json({ error: 'Pending enrollment has expired' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', pendingEnrollment.email)
      .single();

    if (existingUser) {
      console.error(`User already exists: ${pendingEnrollment.email}`);
      // Update pending enrollment to completed but don't create duplicate user
      await supabaseAdmin
        .from('pending_enrollments')
        .update({
          payment_status: 'completed',
          payment_reference: reference,
          completed_at: new Date().toISOString()
        })
        .eq('id', pendingEnrollment.id);
      return NextResponse.json({ received: true, message: 'User already exists' });
    }

    // Create the user account
    const referralCode = generateReferralCode();
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: pendingEnrollment.email,
        full_name: pendingEnrollment.full_name,
        phone_number: pendingEnrollment.phone_number,
        whatsapp_number: pendingEnrollment.whatsapp_number,
        state: pendingEnrollment.state,
        occupation: pendingEnrollment.occupation,
        gender: pendingEnrollment.gender,
        referral_code: referralCode,
        enrollment_type: 'direct',
        enrollment_date: new Date().toISOString(),
        payment_amount: amountInNaira,
        payment_reference: reference,
        status: 'active',
      })
      .select('id')
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

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
    const { data: studentPartner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert({
        user_id: newUser.id,
        email: pendingEnrollment.email,
        full_name: pendingEnrollment.full_name,
        partner_type: 'student',
        referral_code: referralCode,
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
            newUser.id,
            amountInNaira
          );

          await PartnerCommissionService.createCommission(
            partnerReferral.partner_id,
            partnerReferral.id,
            newUser.id,
            amountInNaira
          );

          // Send email notification to partner about successful referral
          const { data: partnerData } = await supabaseAdmin
            .from('partners')
            .select('full_name, email')
            .eq('id', partnerReferral.partner_id)
            .single();

          if (partnerData) {
            await AdminEmailService.sendPartnerReferralEmail({
              partnerName: partnerData.full_name,
              partnerEmail: partnerData.email,
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
        partnerId: newUser.id,
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
        user_id: newUser.id,
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
      userId: newUser.id,
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