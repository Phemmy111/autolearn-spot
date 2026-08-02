import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { CommissionService } from '@/lib/growth-engine/CommissionService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get('referrerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const referralCode = searchParams.get('referralCode') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Release matured commissions before listing
    await CommissionService.releaseMaturedCommissions();

    const commissions = await CommissionService.listCommissions({
      referrerId,
      status,
      referralCode,
      startDate,
      endDate,
    });

    // Calculate summary stats
    const totalCommissions = commissions.length;
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingCount = commissions.filter(c => c.status === 'pending').length;
    const availableCount = commissions.filter(c => c.status === 'available').length;
    const paidCount = commissions.filter(c => c.status === 'paid').length;
    const reversedCount = commissions.filter(c => c.status === 'reversed').length;

    return NextResponse.json({
      success: true,
      commissions,
      summary: {
        totalCommissions,
        totalAmount,
        pendingCount,
        availableCount,
        paidCount,
        reversedCount,
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/commissions] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
