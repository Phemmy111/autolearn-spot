import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublicSettings } from '@/lib/public-settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function isEnrollmentOpen(): Promise<boolean> {
  try {
    const settings = await getPublicSettings(['enrollment_open']);
    return settings.enrollmentOpen !== 'false';
  } catch (error) {
    console.error('Failed to check enrollment status:', error);
    // Fail closed: if settings check fails, block enrollment for security
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingId, email, fullName, callbackUrl } = body;

    if (!pendingId || !email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: pendingId, email, fullName' },
        { status: 400 }
      );
    }

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify pending enrollment exists
    const { data: pendingEnrollment, error: pendingError } = await supabaseAdmin
      .from('pending_enrollments')
      .select('*')
      .eq('id', pendingId)
      .single();

    if (pendingError || !pendingEnrollment) {
      console.error('Pending enrollment not found:', pendingId);
      return NextResponse.json(
        { error: 'Pending enrollment not found' },
        { status: 404 }
      );
    }

    // Check if enrollment is open
    const enrollmentOpen = await isEnrollmentOpen();
    if (!enrollmentOpen) {
      console.log('Enrollment is closed, rejecting payment initialization');
      return NextResponse.json(
        { error: 'Enrollment is currently closed' },
        { status: 403 }
      );
    }

    // Use the stored payment amount from pending enrollment (security: don't trust client)
    const paymentAmount = pendingEnrollment.payment_amount || 8000; // Fallback to 8000 if not set
    console.log('Using payment amount from pending enrollment:', paymentAmount);

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: paymentAmount * 100, // Convert to kobo
        currency: 'NGN',
        metadata: {
          pending_id: pendingId,
          payment_type: 'direct_enrollment',
          full_name: fullName,
        },
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app'}/enroll/success`,
        channels: ['card', 'bank', 'ussd', 'qr'],
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: 'Failed to initialize payment', details: paystackData.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    });

  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
