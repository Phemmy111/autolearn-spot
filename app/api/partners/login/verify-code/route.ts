import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { logReferralEvent } from '@/lib/audit-logging';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and verification code are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const otpKey = `partner_otp_${normalizedEmail}`;

    // 1. Fetch OTP record from site_settings
    const { data: otpSetting, error: otpErr } = await supabaseAdmin
      .from('site_settings')
      .select('id, value')
      .eq('key', otpKey)
      .maybeSingle();

    if (otpErr || !otpSetting) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active verification code found for this email. Please request a new code.' 
      }, { status: 400 });
    }

    let parsedOtp: { code: string; expiresAt: number; attempts: number };
    try {
      parsedOtp = JSON.parse(otpSetting.value);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid verification record. Please request a new code.' }, { status: 400 });
    }

    // 2. Expiration check
    if (Date.now() > parsedOtp.expiresAt) {
      await supabaseAdmin.from('site_settings').delete().eq('id', otpSetting.id);
      return NextResponse.json({ 
        success: false, 
        error: 'Verification code has expired. Please request a new code.' 
      }, { status: 400 });
    }

    // 3. Max attempts check
    if (parsedOtp.attempts >= 5) {
      await supabaseAdmin.from('site_settings').delete().eq('id', otpSetting.id);
      return NextResponse.json({ 
        success: false, 
        error: 'Too many incorrect attempts. Please request a new code.' 
      }, { status: 429 });
    }

    // 4. Code match check
    if (parsedOtp.code !== cleanCode) {
      parsedOtp.attempts = (parsedOtp.attempts || 0) + 1;
      await supabaseAdmin
        .from('site_settings')
        .update({ value: JSON.stringify(parsedOtp), updated_at: new Date().toISOString() })
        .eq('id', otpSetting.id);

      const remaining = 5 - parsedOtp.attempts;
      return NextResponse.json({ 
        success: false, 
        error: `Incorrect code. ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Please request a new code.'}` 
      }, { status: 400 });
    }

    // 5. Code verified! Remove used OTP
    await supabaseAdmin.from('site_settings').delete().eq('id', otpSetting.id);

    // 6. Look up partner record
    const { data: partners, error: partnerErr } = await supabaseAdmin
      .from('partners')
      .select('*')
      .ilike('email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (partnerErr || !partners || partners.length === 0) {
      return NextResponse.json({ success: false, error: 'Partner record not found' }, { status: 404 });
    }

    const partner = partners[0];

    if (partner.status === 'suspended' || partner.status === 'inactive') {
      return NextResponse.json({ success: false, error: `Account is currently ${partner.status}.` }, { status: 403 });
    }

    // 7. Create authenticated session using partner.id
    await SessionService.createSession(partner.id, 'community');

    // 8. Log audit event
    await logReferralEvent({
      action: 'partner_login_otp',
      category: 'auth',
      user_id: partner.id,
      description: `Affiliate partner ${partner.name || partner.email} logged in via OTP`,
      metadata: { email: normalizedEmail, partnerId: partner.id }
    });

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
      },
    });
  } catch (error: any) {
    console.error('[Verify Login Code] Server error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
