import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received enrollment data:', body);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);

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
      console.error('Missing required fields:', { fullName, email, phoneNumber, state, occupation, gender, referralSource });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if there's already a pending enrollment for this email
    console.log('Checking for existing pending enrollment for email:', email);
    const { data: existingPending, error: existingError } = await supabaseAdmin
      .from('pending_enrollments')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing pending enrollment:', existingError);
      console.error('Error details:', JSON.stringify(existingError, null, 2));
    }

    if (existingPending) {
      // If existing pending enrollment is less than 24 hours old and pending, return it
      const createdAt = new Date(existingPending.created_at);
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      if (existingPending.payment_status === 'pending' && hoursSinceCreation < 24) {
        return NextResponse.json({
          pendingId: existingPending.id,
          message: 'Existing pending enrollment found'
        });
      } else {
        // Update the expired/failed record instead of creating a new one
        const { data: updatedPending, error: updateError } = await supabaseAdmin
          .from('pending_enrollments')
          .update({
            full_name: fullName,
            phone_number: phoneNumber,
            whatsapp_number: whatsappNumber || phoneNumber,
            state: state,
            occupation: occupation,
            gender: gender,
            referral_source: referralSource,
            referral_code: referralCode || null,
            payment_amount: 8000,
            payment_status: 'pending',
            expires_at: expiresAt,
            user_agent: request.headers.get('user-agent') || null,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          })
          .eq('id', existingPending.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating existing pending enrollment:', updateError);
          return NextResponse.json(
            { error: 'Failed to update existing enrollment', details: updateError.message },
            { status: 500 }
          );
        }

        // Send admin notification about new registration
        await AdminEmailService.sendStudentRegistrationEmail({
          fullName,
          email,
          phoneNumber,
          state,
          occupation,
          gender,
          referralSource,
          referralCode
        });

        return NextResponse.json({
          pendingId: updatedPending.id,
          message: 'Existing enrollment updated successfully'
        });
      }
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referralCode && referralCode.length === 8) {
      const { data: referralCodeData, error: referralError } = await supabaseAdmin
        .from('referral_codes')
        .select('id, owner_id, owner_type, status')
        .eq('code', referralCode)
        .eq('status', 'Active')
        .maybeSingle();

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error validating referral code:', referralError);
      }

      if (referralCodeData) {
        referredBy = referralCodeData.id;
      }
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create pending enrollment
    console.log('Creating pending enrollment with data:', {
      full_name: fullName,
      email: email.toLowerCase(),
      phone_number: phoneNumber,
      payment_amount: 8000,
      payment_status: 'pending',
      expires_at: expiresAt
    });

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
      .select()
      .single();

    if (error) {
      console.error('Error creating pending enrollment:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      return NextResponse.json(
        { error: 'Failed to create pending enrollment', details: error.message },
        { status: 500 }
      );
    }

    if (!pendingEnrollment || !pendingEnrollment.id) {
      console.error('No pending enrollment ID returned');
      return NextResponse.json(
        { error: 'Failed to create pending enrollment - no ID returned' },
        { status: 500 }
      );
    }

    // Send admin notification about new registration
    await AdminEmailService.sendStudentRegistrationEmail({
      fullName,
      email,
      phoneNumber,
      state,
      occupation,
      gender,
      referralSource,
      referralCode
    });

    return NextResponse.json({
      pendingId: pendingEnrollment.id,
      message: 'Pending enrollment created successfully'
    });

  } catch (error) {
    console.error('Error in pending enrollment API:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}