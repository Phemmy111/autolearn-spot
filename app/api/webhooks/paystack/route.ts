import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to log payment events
async function logPaymentEvent(reference: string, eventType: string, description: string) {
  try {
    await supabaseAdmin.from('payment_events').insert({
      payment_reference: reference,
      event_type: eventType,
      description: description
    });
  } catch (error) {
    console.error('Failed to log payment event:', error);
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify signature
    const hash = crypto.createHmac('sha512', secret).update(bodyText).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const reference = data.reference;
      
      await logPaymentEvent(reference, 'webhook_received', `Received charge.success for ${data.amount}`);

      // 1. Idempotency Check: See if payment already exists
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('reference', reference)
        .single();

      if (existingPayment) {
        await logPaymentEvent(reference, 'duplicate_detected', 'Payment reference already processed.');
        return NextResponse.json({ message: 'Already processed' }, { status: 200 });
      }

      // 2. Save Payment
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

      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert(paymentData);

      if (paymentError) {
        console.error('Error saving payment:', paymentError);
        await logPaymentEvent(reference, 'processing_failed', `Failed to save payment record: ${paymentError.message}`);
        // Return 500 so Paystack retries if it was a db error
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // 3. Resolve Cohort (Metadata -> Fallback Active Cohort)
      let resolvedCohortId = data.metadata?.cohort_id;
      
      if (!resolvedCohortId && data.metadata?.course_slug) {
        // Try to look up by slug
        const { data: slugCohort } = await supabaseAdmin
          .from('cohorts')
          .select('id')
          .eq('slug', data.metadata.course_slug)
          .single();
        if (slugCohort) {
          resolvedCohortId = slugCohort.id;
        }
      }

      if (!resolvedCohortId) {
        // Fallback to current active cohort
        const { data: activeCohort } = await supabaseAdmin
          .from('cohorts')
          .select('id')
          .eq('is_current', true)
          .single();
        
        if (activeCohort) {
          resolvedCohortId = activeCohort.id;
          console.warn(`[Webhook] Falling back to current active cohort for payment ${reference}`);
        }
      }

      if (!resolvedCohortId) {
        await logPaymentEvent(reference, 'processing_failed', 'Could not resolve any cohort for enrollment.');
        // We saved the payment, but couldn't enroll. Return 200 so Paystack stops retrying, we'll manually fix.
        return NextResponse.json({ message: 'Payment saved, but cohort missing' }, { status: 200 });
      }

      // 4. Create/Upsert Enrollment
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
        console.error('Error creating enrollment:', enrollError);
        await logPaymentEvent(reference, 'processing_failed', `Failed to create enrollment: ${enrollError.message}`);
        // Payment is saved, but enrollment failed. Let admin resync later.
        return NextResponse.json({ message: 'Payment saved, enrollment failed' }, { status: 200 });
      }

      await logPaymentEvent(reference, 'enrollment_created', `Successfully enrolled ${data.customer.email} into cohort ${resolvedCohortId}`);
      
      // TODO: Resend Email Confirmation (Phase 2 or later)
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
