import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/admin';

export async function POST(req: Request) {
  try {
    const adminCheck = await requireSuperAdmin();
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Fetch from Paystack directly to ensure absolute ground truth
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

    // 2. Save/Update to payments table
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

    // 3. Resolve Cohort (Metadata -> Fallback Active Cohort)
    let resolvedCohortId = data.metadata?.cohort_id;
    if (!resolvedCohortId && data.metadata?.course_slug) {
      const { data: slugCohort } = await supabaseAdmin.from('cohorts').select('id').eq('slug', data.metadata.course_slug).single();
      if (slugCohort) resolvedCohortId = slugCohort.id;
    }
    if (!resolvedCohortId) {
      const { data: activeCohort } = await supabaseAdmin.from('cohorts').select('id').eq('is_current', true).single();
      if (activeCohort) resolvedCohortId = activeCohort.id;
    }

    if (!resolvedCohortId) {
      return NextResponse.json({ error: 'Could not resolve any cohort for enrollment' }, { status: 400 });
    }

    // 4. Upsert Enrollment mapping
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        cohort_id: resolvedCohortId,
        email: data.customer.email,
        payment_ref: reference,
        amount_paid: data.amount,
        status: 'active',
        activated_at: new Date().toISOString()
      }, {
        onConflict: 'cohort_id, email'
      });

    if (enrollError) {
      console.error('Error resyncing enrollment:', enrollError);
      return NextResponse.json({ error: 'Failed to resync enrollment' }, { status: 500 });
    }

    // Log the event
    await supabaseAdmin.from('payment_events').insert({
      payment_reference: reference,
      event_type: 'resync_executed',
      description: `Super admin manually resynced payment and enrollment.`
    });

    return NextResponse.json({ success: true, message: 'Payment successfully resynced' }, { status: 200 });

  } catch (err: any) {
    console.error('Resync Payment Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
