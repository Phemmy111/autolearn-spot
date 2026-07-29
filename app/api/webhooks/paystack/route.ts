import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/scholarship-emails';
import { scholarshipConfig } from '@/config/scholarship';

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

    if (!signature) {
      console.error('Missing Paystack signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha512', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

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
        .select('id, full_name, reference_number, email, status, payment_status')
        .eq('email', customerEmail)
        .eq('status', 'Accepted')
        .single();

      if (fetchError || !application) {
        console.error('Application not found for email:', customerEmail);
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Check if payment is already verified
      if (application.payment_status === 'Verified') {
        console.log('Payment already verified for:', customerEmail);
        // Still send welcome email even if already verified
        try {
          await sendWelcomeEmail({
            to: application.email,
            fullName: application.full_name,
            referenceNumber: application.reference_number,
          });
          console.log('Welcome email sent to:', customerEmail);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
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
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }

      console.log('Payment status updated to Verified for:', customerEmail);

      // Send welcome email
      try {
        await sendWelcomeEmail({
          to: application.email,
          fullName: application.full_name,
          referenceNumber: application.reference_number,
        });
        console.log('Welcome email sent to:', customerEmail);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
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
