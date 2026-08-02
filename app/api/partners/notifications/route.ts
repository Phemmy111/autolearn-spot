import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { NotificationService } from '@/lib/growth-engine/NotificationService';

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
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
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { action, notificationId } = await request.json();

    if (action === 'mark_read' && notificationId) {
      const success = await NotificationService.markAsRead(notificationId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      const success = await NotificationService.markAllAsRead(partner.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/partners/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}