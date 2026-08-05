import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    // Wait for params to resolve
    const resolvedParams = await params;
    console.log('[POST /api/admin/partners/:id/resend-email] Resolved params:', resolvedParams);
    
    const body = await request.json();
    const { emailType } = body; // 'welcome' or 'admin_notification'

    // Get partner details
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (partnerError || !partner) {
      console.error('[POST /api/admin/partners/:id/resend-email] Partner not found:', partnerError);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    console.log('[POST /api/admin/partners/:id/resend-email] Partner found:', partner.email, 'Type:', partner.partner_type);

    // Generate referral code
    const referralCode = `REF${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;

    let emailSent = false;
    let errorMessage = '';

    if (emailType === 'welcome') {
      try {
        await AdminEmailService.sendPartnerWelcomeEmail({
          partnerName: partner.full_name,
          partnerEmail: partner.email,
          partnerId: partner.id,
          partnerType: partner.partner_type,
          referralCode: referralCode,
          tempPassword: 'Use your login link to set your password'
        });
        emailSent = true;
        console.log('[POST /api/admin/partners/:id/resend-email] Welcome email sent successfully');
      } catch (emailError) {
        console.error('[POST /api/admin/partners/:id/resend-email] Failed to send welcome email:', emailError);
        errorMessage = String(emailError);
      }
    } else if (emailType === 'admin_notification') {
      try {
        await AdminEmailService.sendPartnerCreatedEmail({
          partnerName: partner.full_name,
          partnerEmail: partner.email,
          partnerType: partner.partner_type,
          partnerId: partner.id,
          referralCode: referralCode
        });
        emailSent = true;
        console.log('[POST /api/admin/partners/:id/resend-email] Admin notification email sent successfully');
      } catch (emailError) {
        console.error('[POST /api/admin/partners/:id/resend-email] Failed to send admin email:', emailError);
        errorMessage = String(emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      emailSent,
      errorMessage: errorMessage || null
    });
  } catch (error) {
    console.error('[POST /api/admin/partners/:id/resend-email] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}