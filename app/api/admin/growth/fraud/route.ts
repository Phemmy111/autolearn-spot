import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { data: alerts, error } = await supabaseAdmin
      .from('fraud_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/growth/fraud] DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error('[GET /api/admin/growth/fraud] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { alertId, status, notes } = body;

    if (!alertId || !status) {
      return NextResponse.json({ error: 'Missing alertId or status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('fraud_alerts')
      .update({
        status,
        resolution_notes: notes,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update fraud alert' }, { status: 500 });
    }

    await logReferralEvent({
      action: 'fraud_alert_resolved',
      category: 'status_change',
      user_id: undefined,
      description: `Fraud alert ${alertId} resolved as ${status}`,
      metadata: { alertId, adminId, status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/growth/fraud] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
