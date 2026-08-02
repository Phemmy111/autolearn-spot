import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phoneNumber,
      whatsappNumber,
      state,
      occupation,
      gender,
      referralSource,
      referralCode
    } = body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !state || !occupation || !gender || !referralSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if there's already a pending enrollment for this email
    const { data: existingPending } = await supabaseAdmin
      .from('pending_enrollments')
      .select('*')
      .eq('email', email)
      .eq('payment_status', 'pending')
      .single();

    if (existingPending) {
      // If existing pending enrollment is less than 24 hours old, return it
      const createdAt = new Date(existingPending.created_at);
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return NextResponse.json({
          pendingId: existingPending.id,
          message: 'Existing pending enrollment found'
        });
      } else {
        // Expire the old one
        await supabaseAdmin
          .from('pending_enrollments')
          .update({ payment_status: 'expired' })
          .eq('id', existingPending.id);
      }
    }

    // Check if user already exists as a student
    const { data: existingStudent } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referralCode && referralCode.length === 8) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id, referral_code, status')
        .eq('referral_code', referralCode)
        .eq('status', 'active')
        .single();

      if (partner) {
        referredBy = partner.id;
      }
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create pending enrollment
    const { data: pendingEnrollment, error } = await supabaseAdmin
      .from('pending_enrollments')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone_number: phoneNumber,
        whatsapp_number: whatsappNumber || phoneNumber,
        state: state,
        occupation: occupation,
        gender: gender,
        referral_source: referralSource,
        referral_code: referralCode || null,
        referred_by: referredBy,
        payment_amount: 8000, // Direct Enrollment amount
        payment_status: 'pending',
        expires_at: expiresAt,
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating pending enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to create pending enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingId: pendingEnrollment.id,
      message: 'Pending enrollment created successfully'
    });

  } catch (error) {
    console.error('Error in pending enrollment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}