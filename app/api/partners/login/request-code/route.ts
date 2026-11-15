import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Look up partner in partners table
    const { data: partners, error: partnerErr } = await supabaseAdmin
      .from('partners')
      .select('id, name, email, status')
      .ilike('email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (partnerErr) {
      console.error('[Request Login Code] DB error looking up partner:', partnerErr);
      return NextResponse.json({ success: false, error: 'Error checking affiliate account' }, { status: 500 });
    }

    if (!partners || partners.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No affiliate partner account found for this email. Please verify your email or apply to become a partner.' 
      }, { status: 404 });
    }

    const partner = partners[0];

    // 2. Check partner status
    if (partner.status === 'suspended' || partner.status === 'inactive') {
      return NextResponse.json({ 
        success: false, 
        error: `Your affiliate account is currently ${partner.status}. Please contact support.` 
      }, { status: 403 });
    }

    // 3. Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const otpKey = `partner_otp_${normalizedEmail}`;
    const otpValue = JSON.stringify({
      code,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

    // 4. Save code in site_settings
    const { data: existingOtp } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('key', otpKey)
      .maybeSingle();

    if (existingOtp) {
      await supabaseAdmin
        .from('site_settings')
        .update({ value: otpValue, updated_at: new Date().toISOString() })
        .eq('id', existingOtp.id);
    } else {
      await supabaseAdmin
        .from('site_settings')
        .insert({ key: otpKey, value: otpValue });
    }

    // 5. Send login code email
    const emailSent = await EmailService.sendPartnerLoginCode(
      normalizedEmail,
      partner.name || 'Partner',
      code
    );

    if (!emailSent) {
      console.warn('[Request Login Code] Email failed to send, code logged for fallback:', code);
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
    });
  } catch (error: any) {
    console.error('[Request Login Code] Server error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
