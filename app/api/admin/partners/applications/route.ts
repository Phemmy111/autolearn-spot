import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AmbassadorService } from '@/lib/growth-engine/AmbassadorService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, applications: data });
  } catch (error) {
    console.error('[GET /api/admin/partners/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('[POST /api/admin/partners/applications] Request body:', body);
    const { applicationId, action, notes } = body;

    if (!applicationId || !action || !['approve', 'reject'].includes(action)) {
      console.error('[POST /api/admin/partners/applications] Invalid payload:', { applicationId, action });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await AmbassadorService.processApplication({
      applicationId,
      action: action as 'approve' | 'reject',
      adminId,
      notes
    });

    console.log('[POST /api/admin/partners/applications] Result:', result);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/partners/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('partner_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved applications can have emails resent' }, { status: 400 });
    }

    // Get partner record to get commission rate (fallback to application partner_type)
    let commissionRate = application.partner_type === 'influencer' ? 2500 : 1500;
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('commission_rate')
      .eq('email', application.email)
      .single();

    if (!partnerError && partner) {
      commissionRate = partner.commission_rate;
    }

    // Generate new temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    console.log('[PUT /api/admin/partners/applications] Generated temporary password for email:', temporaryPassword);
    const passwordHash = CommunityAuthService.hashPassword(temporaryPassword);
    console.log('[PUT /api/admin/partners/applications] Generated password hash:', passwordHash.substring(0, 20) + '...');

    // Update community ambassador password
    const { error: updateError } = await supabaseAdmin
      .from('community_ambassadors')
      .update({ password_hash: passwordHash })
      .eq('email', application.email);

    if (updateError) {
      console.error('Failed to update ambassador password:', updateError);
      // Continue anyway to send email with current password
    } else {
      console.log('[PUT /api/admin/partners/applications] Password updated successfully in database');
    }

    // Send email
    const emailResult = await PartnerEmailService.sendApplicationApprovedEmail(
      application.email,
      application.full_name,
      temporaryPassword,
      'https://autolearn-spot.vercel.app/partners/login',
      'https://autolearn-spot.vercel.app/partners/dashboard',
      commissionRate
    );

    if (!emailResult) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email resent successfully' });
  } catch (error) {
    console.error('[PUT /api/admin/partners/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}