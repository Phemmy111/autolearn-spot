import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';

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

    // Get or generate password
    let tempPassword = '';
    const authTableName = partner.partner_type === 'influencer' ? 'influencers' : 'community_ambassadors';
    const linkField = partner.partner_type === 'influencer' ? 'influencer_id' : 'community_ambassador_id';
    
    try {
      // Try to get existing auth record
      const { data: authRecord } = await supabaseAdmin
        .from(authTableName)
        .select('password')
        .eq('id', partner[linkField])
        .single();
      
      if (authRecord && authRecord.password) {
        // Password exists in auth table, generate a new temporary one
        tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPassword = CommunityAuthService.hashPassword(tempPassword);
        
        await supabaseAdmin
          .from(authTableName)
          .update({ password: hashedPassword })
          .eq('id', partner[linkField]);
          
        console.log('[POST /api/admin/partners/:id/resend-email] Generated new password for existing auth record');
      } else {
        // No auth record, generate new password
        tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPassword = CommunityAuthService.hashPassword(tempPassword);
        
        const { data: newAuthRecord } = await supabaseAdmin
          .from(authTableName)
          .insert({
            full_name: partner.full_name,
            email: partner.email,
            password: hashedPassword,
            status: 'active'
          })
          .select()
          .single();
          
        if (newAuthRecord) {
          await supabaseAdmin
            .from('partners')
            .update({ [linkField]: newAuthRecord.id })
            .eq('id', partner.id);
        }
        
        console.log('[POST /api/admin/partners/:id/resend-email] Created new auth record with password');
      }
    } catch (authError) {
      console.error('[POST /api/admin/partners/:id/resend-email] Auth record error:', authError);
      tempPassword = 'Please contact admin for login credentials';
    }

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
          tempPassword: tempPassword
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