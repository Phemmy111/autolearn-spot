import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sendFollowupForOrder, isFollowupAlreadySent } from '@/lib/abandoned-checkout';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const { id: orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const force = Boolean(body?.force);

    const result = await sendFollowupForOrder(orderId, { force });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send follow-up',
          alreadySent: result.alreadySent,
          alreadyPaid: result.alreadyPaid,
          alreadyEnrolled: result.alreadyEnrolled,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Follow-up email dispatched successfully',
      customerEmail: result.customerEmail,
    });
  } catch (error: any) {
    console.error('Error in manual follow-up route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const { id: orderId } = await context.params;
    const sent = await isFollowupAlreadySent(orderId);
    return NextResponse.json({ success: true, alreadySent: sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
