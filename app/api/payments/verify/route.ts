import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

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
      return NextResponse.json({ error: 'Could not resolve cohort for enrollment' }, { status: 400 });
    }

    // Upsert Enrollment mapping to the logged-in clerkUserId
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        cohort_id: resolvedCohortId,
        email: payment.customer_email,
        clerk_user_id: userId,
        payment_ref: reference,
        amount_paid: payment.amount,
        status: 'active',
        activated_at: new Date().toISOString()
      }, {
        onConflict: 'cohort_id, email'
      });

    if (enrollError) {
      console.error('Error creating enrollment during verify:', enrollError);
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
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
