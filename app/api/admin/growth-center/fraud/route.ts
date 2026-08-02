import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { FraudService } from '@/lib/growth-engine/FraudService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'open' | 'investigating' | 'resolved' | 'dismissed' | undefined;
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const alerts = await FraudService.getFraudAlerts({ status, severity, limit });

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error('[GET /api/admin/growth-center/fraud] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { alertId, action, notes } = await request.json();

    if (!alertId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'resolve' || action === 'dismiss') {
      const result = await FraudService.resolveFraudAlert(alertId, {
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        notes,
        adminId
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin/growth-center/fraud] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}