import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate partner ID
function generatePartnerId(): string {
  const prefix = 'ALS';
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${suffix}`;
}

// Helper function to generate referral code
function generateReferralCode(): string {
  const prefix = 'REF';
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `${prefix}${suffix}`;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, partners: data });
  } catch (error) {
    console.error('[GET /api/admin/partners] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      console.error('[POST /api/admin/partners] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('[POST /api/admin/partners] Request body:', body);
    
    const {
      full_name,
      email,
      phone,
      whatsapp,
      partner_type,
      commission_rate,
      password,
      status
    } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Generate partner ID
    const partnerId = generatePartnerId();
    console.log('[POST /api/admin/partners] Generated partner ID:', partnerId);

    // Generate referral code
    const referralCode = generateReferralCode();
    console.log('[POST /api/admin/partners] Generated referral code:', referralCode);

    // Build insert object with only columns that exist
    const insertData: any = {
      partner_id: partnerId,
      full_name,
      email,
      partner_type: partner_type || 'community',
      status: status || 'active',
      commission_rate: commission_rate || 1500
    };

    // Only add phone if provided
    if (phone) insertData.phone = phone;

    // Only add whatsapp if provided
    if (whatsapp) insertData.whatsapp = whatsapp;

    console.log('[POST /api/admin/partners] Insert data:', insertData);

    // Create partner record
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert(insertData)
      .select()
      .single();

    if (partnerError) {
      console.error('[POST /api/admin/partners] Failed to create partner:', partnerError);
      console.error('[POST /api/admin/partners] Error details:', JSON.stringify(partnerError, null, 2));
      console.error('[POST /api/admin/partners] Error code:', partnerError.code);
      console.error('[POST /api/admin/partners] Error message:', partnerError.message);
      console.error('[POST /api/admin/partners] Error hint:', partnerError.hint);
      console.error('[POST /api/admin/partners] Error details:', partnerError.details);
      return NextResponse.json({ 
        error: 'Failed to create partner', 
        details: partnerError.message,
        code: partnerError.code,
        hint: partnerError.hint
      }, { status: 500 });
    }

    console.log('[POST /api/admin/partners] Partner created successfully:', partner);

    // Skip referral record creation for now to avoid database errors
    // Future: implement referral tracking when database schema is ready

    // Send email notification to admin about new partner
    let adminEmailSent = false;
    try {
      await AdminEmailService.sendPartnerCreatedEmail({
        partnerName: full_name,
        partnerEmail: email,
        partnerType: partner_type || 'community',
        partnerId: partner.id,
        referralCode: referralCode
      });
      adminEmailSent = true;
      console.log('[POST /api/admin/partners] Admin email sent successfully');
    } catch (emailError) {
      console.error('[POST /api/admin/partners] Failed to send admin email:', emailError);
      // Continue anyway
    }

    // Send welcome email to new partner with login details
    let partnerEmailSent = false;
    try {
      await AdminEmailService.sendPartnerWelcomeEmail({
        partnerName: full_name,
        partnerEmail: email,
        partnerId: partner.id,
        referralCode: referralCode,
        tempPassword: password || 'Set your password via the login link'
      });
      partnerEmailSent = true;
      console.log('[POST /api/admin/partners] Partner welcome email sent successfully');
    } catch (emailError) {
      console.error('[POST /api/admin/partners] Failed to send partner email:', emailError);
      // Continue anyway
    }

    return NextResponse.json({ 
      success: true, 
      partner,
      emailStatus: {
        adminEmail: adminEmailSent,
        partnerEmail: partnerEmailSent
      }
    });
  } catch (error) {
    console.error('[POST /api/admin/partners] Error:', error);
    console.error('[POST /api/admin/partners] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
