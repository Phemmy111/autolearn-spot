import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Check if we already have it in DB
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('reference', reference)
      .single();

    if (existingPayment?.status === 'success') {
      // It's already in the DB. Let's make sure the enrollment is also there for this clerk user
      // We will handle this logic below to ensure enrollment is created if missing
    } else {
      // 2. Fetch from Paystack
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secret}`
        }
      });
      
      const verifyData = await verifyRes.json();
      
      if (!verifyData.status || verifyData.data.status !== 'success') {
        return NextResponse.json({ error: 'Payment not found or not successful on Paystack' }, { status: 400 });
      }

      const data = verifyData.data;

      // 3. Save to payments table
      const paymentData = {
        transaction_id: data.id,
        reference: reference,
        gateway_response: data.gateway_response,
        currency: data.currency,
        amount: data.amount,
        paid_at: data.paid_at,
        channel: data.channel,
        fees: data.fees,
        status: data.status,
        customer_email: data.customer.email,
        customer_name: `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim(),
        metadata: data.metadata || {},
      };

      await supabaseAdmin.from('payments').upsert(paymentData, { onConflict: 'reference' });
      await supabaseAdmin.from('payment_events').insert({
        payment_reference: reference,
        event_type: 'verification_passed',
        description: `Manual verification successful for amount ${data.amount}`
      });
    }

    // Now, get the payment again to build the enrollment
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('reference', reference)
      .single();

    if (!payment || payment.status !== 'success') {
      return NextResponse.json({ error: 'Failed to verify payment details' }, { status: 500 });
    }

    // Resolve Cohort
    let resolvedCohortId = payment.metadata?.cohort_id;
    if (!resolvedCohortId && payment.metadata?.course_slug) {
      const { data: slugCohort } = await supabaseAdmin.from('cohorts').select('id').eq('slug', payment.metadata.course_slug).single();
      if (slugCohort) resolvedCohortId = slugCohort.id;
    }
    if (!resolvedCohortId) {
      const { data: activeCohort } = await supabaseAdmin.from('cohorts').select('id').eq('is_current', true).single();
      if (activeCohort) resolvedCohortId = activeCohort.id;
    }

    if (!resolvedCohortId) {
      return NextResponse.json({ error: 'No active cohort found. Please activate a cohort before processing payments.' }, { status: 400 });
    }

    // Upsert Enrollment mapping to the logged-in clerkUserId
    const enrollmentData: any = {
      cohort_id: resolvedCohortId,
      email: payment.customer_email,
      clerk_user_id: userId,
      payment_ref: reference,
      amount_paid: payment.amount,
      status: 'active',
      activated_at: new Date().toISOString()
    }

    // Add name fields from payment customer data
    if (payment.customer_name) {
      enrollmentData.full_name = payment.customer_name
      const nameParts = payment.customer_name.split(' ')
      if (nameParts.length > 0) enrollmentData.first_name = nameParts[0]
      if (nameParts.length > 1) enrollmentData.last_name = nameParts.slice(1).join(' ')
    }

    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollmentData, {
        onConflict: 'cohort_id, email'
      });

    if (enrollError) {
      console.error('Error creating enrollment during verify:', enrollError);
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }

    // ============================================
    // GROWTH ENGINE: Auto-create Student Partner
    // ============================================
    // Every student who purchases the ₦8,000 course becomes a Student Partner
    if (payment.amount === 8000) {
      const partnerResult = await PartnerService.createStudentPartner(
        userId,
        payment.customer_email,
        payment.customer_name || 'Student'
      );

      if (partnerResult.success) {
        console.log(`[Growth Engine] Student partner created for ${payment.customer_email}`);
      }
    }

    // ============================================
    // GROWTH ENGINE: Process Referral Commission
    // ============================================
    // Check for referral cookie
    const cookieStore = await cookies();
    const referralCookie = cookieStore.get('referral_code');

    if (referralCookie && referralCookie.value) {
      // Validate referral code
      const validation = await ReferralService.validateAndAttribute(referralCookie.value, userId);

      if (validation.valid && validation.owner_id && validation.owner_type) {
        // Only create commission for ₦8,000 course purchases (not scholarship ₦5,000)
        if (payment.amount === 8000) {
          // Get IP address from request headers for fraud detection
          const ipAddress = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           'unknown';

          const commissionResult = await CommissionService.recordCommission({
            referrerId: validation.owner_id,
            referrerType: validation.owner_type,
            refereeEmail: payment.customer_email,
            referralCode: validation.code,
            paymentReference: reference,
            courseAmount: payment.amount,
            ipAddress
          });

          if (commissionResult.success) {
            console.log(`[Growth Engine] Commission created for referral ${validation.code}`);

            // Update referral registration count
            await supabaseAdmin
              .from('referral_codes')
              .update({ 
                total_registrations: (await supabaseAdmin
                  .from('referral_codes')
                  .select('total_registrations')
                  .eq('code', validation.code)
                  .single()).data?.total_registrations || 0 + 1
              })
              .eq('code', validation.code);

            // Update partner stats
            await PartnerService.updatePartnerStats(validation.owner_id);
          }
        }
      }
    }

    await supabaseAdmin.from('payment_events').insert({
      payment_reference: reference,
      event_type: 'verification_endpoint_used',
      description: `User ${userId} successfully used manual verification.`
    });

    return NextResponse.json({ success: true, message: 'Verification successful and enrolled' }, { status: 200 });

  } catch (err: any) {
    console.error('Verify Payment Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
