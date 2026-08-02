import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    let query = supabaseAdmin
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/admin/growth-center/applications] Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, applications: data });
  } catch (error) {
    console.error('[GET /api/admin/growth-center/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { applicationId, action, notes } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await PartnerService.approveCommunityPartnerApplication(applicationId, adminId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      // Email is already sent in PartnerService
      return NextResponse.json({ success: true, partner: result.partner });
    } else if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('partner_applications')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
      }

      // Send rejection email
      const { data: application } = await supabaseAdmin
        .from('partner_applications')
        .select('email, full_name')
        .eq('id', applicationId)
        .single();

      if (application) {
        await PartnerEmailService.sendApplicationRejectedEmail(
          application.email,
          application.full_name,
          notes
        );
      }

      return NextResponse.json({ success: true });
    } else if (action === 'request_info') {
      const { error } = await supabaseAdmin
        .from('partner_applications')
        .update({
          status: 'need_more_info',
          admin_notes: notes,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
      }

      // Send need more info email
      const { data: application } = await supabaseAdmin
        .from('partner_applications')
        .select('email, full_name')
        .eq('id', applicationId)
        .single();

      if (application) {
        await PartnerEmailService.sendNeedMoreInfoEmail(
          application.email,
          application.full_name,
          notes
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin/growth-center/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}