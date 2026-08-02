import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { AmbassadorService } from '@/lib/growth-engine/AmbassadorService';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/ambassadors/applications] DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, applications: data });
  } catch (error) {
    console.error('[GET /api/admin/ambassadors/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { applicationId, action, notes } = body; // action: 'approve' | 'reject'

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Missing applicationId or action' }, { status: 400 });
    }

    const result = await AmbassadorService.processApplication({
      applicationId,
      action,
      adminId,
      notes
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/ambassadors/applications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
