import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/admin';
import { fulfillCartOrder } from '@/lib/order-fulfillment';

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (authError) {
    return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 });
  }

  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Fetch from Paystack directly to ensure absolute ground truth
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secret}`
      }
    });
    
    const verifyData = await verifyRes.json();
    
    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not found or not successful on Paystack' }, { status: 400 });
    }

    const data = verifyData.data;

    // 2. Check if this corresponds to a modern cart order or has cart_checkout metadata
    const orderId = data.metadata?.order_id;
    let orderToFulfill = null;
    if (orderId) {
      const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
      orderToFulfill = o;
    }
    if (!orderToFulfill) {
      const { data: o } = await supabaseAdmin
        .from('orders')
        .select('*')
        .or(`provider_ref.eq.${reference},order_ref.eq.${reference}`)
        .maybeSingle();
      orderToFulfill = o;
    }

    if (orderToFulfill || data.metadata?.payment_type === 'cart_checkout') {
      const paystackCustomerName = [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(' ');
      const confirmedFullName = data.metadata?.full_name || paystackCustomerName || orderToFulfill?.customer_name || 'Student';
      const affiliateRef = data.metadata?.affiliate_ref;

      const fulfillResult = await fulfillCartOrder({
        orderId: orderToFulfill?.id || orderId,
        reference,
        customerEmail: data.customer?.email || orderToFulfill?.customer_email,
        customerName: confirmedFullName,
        amountInNaira: Math.round(data.amount / 100),
        ipAddress: data.ip_address,
        affiliateRef,
        resendEmails: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Cart order successfully fulfilled and confirmation emails dispatched.',
        fulfillResult,
      });
    }

    // 3. Fallback: Resolve Cohort (Metadata -> Fallback Active Cohort)
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
      return NextResponse.json({ error: 'Could not resolve any cohort or course for enrollment' }, { status: 400 });
    }

    // 4. Upsert Enrollment mapping
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        cohort_id: resolvedCohortId,
        email: data.customer.email,
        payment_ref: reference,
        amount_paid: data.amount ? data.amount / 100 : 0,
        status: 'active',
        activated_at: new Date().toISOString()
      }, {
        onConflict: 'cohort_id, email'
      });

    if (enrollError) {
      console.error('Error resyncing enrollment:', enrollError);
      return NextResponse.json({ error: 'Failed to resync enrollment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Payment successfully resynced and enrolled.' }, { status: 200 });

  } catch (err: any) {
    console.error('Resync Payment Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
