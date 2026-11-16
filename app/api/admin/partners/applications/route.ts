import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/partners/applications
 * Returns all partner applications (partners with status = 'pending')
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((app) => ({
      ...app,
      full_name: app.name,
      partner_type: 'affiliate',
    }));

    return NextResponse.json({ success: true, applications: mapped });
  } catch (error: any) {
    console.error('[GET /api/admin/partners/applications] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/partners/applications
 * Approve or Reject a partner application
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { applicationId, action } = body;

    if (!applicationId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';

    const { data: partner, error: updateError } = await supabaseAdmin
      .from('partners')
      .update({ status: newStatus })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError || !partner) {
      return NextResponse.json(
        { error: updateError?.message || 'Partner not found' },
        { status: 400 }
      );
    }

    // If approved, ensure referral code exists
    let refCode = partner.partner_id;
    if (newStatus === 'active') {
      const { data: existingCode } = await supabaseAdmin
        .from('referral_codes')
        .select('code')
        .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`)
        .maybeSingle();

      if (!existingCode) {
        refCode = generateReferralCode();
        await supabaseAdmin.from('referral_codes').insert({
          code: refCode,
          owner_id: partner.id,
          partner_id: partner.id,
          clicks: 0,
          conversions: 0,
        });
      } else {
        refCode = existingCode.code;
      }

      // Send approval welcome email
      try {
        await AdminEmailService.sendPartnerWelcomeEmail({
          partnerName: partner.name,
          partnerEmail: partner.email,
          partnerId: partner.partner_id,
          partnerType: 'affiliate',
          referralCode: refCode,
          tempPassword: 'Use your email OTP code to log in at /partners/login',
        });
      } catch (err) {
        console.warn('Could not send approval email:', err);
      }
    }

    return NextResponse.json({ success: true, partner });
  } catch (error: any) {
    console.error('[POST /api/admin/partners/applications] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
