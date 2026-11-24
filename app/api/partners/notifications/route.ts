import { NextResponse } from 'next/server';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';
import { NotificationService } from '@/lib/growth-engine/NotificationService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await NotificationService.getNotifications(partner.id);
    const unreadCount = await NotificationService.getUnreadCount(partner.id);

    return NextResponse.json({ 
      success: true, 
      notifications,
      unreadCount 
    });
  } catch (error) {
    console.error('[GET /api/partners/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notificationId } = await request.json();

    if (action === 'mark_read' && notificationId) {
      await NotificationService.markAsRead(notificationId);
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      await NotificationService.markAllAsRead(partner.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/partners/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
