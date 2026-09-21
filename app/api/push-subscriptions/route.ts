import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PushNotificationService } from '@/lib/push-notification-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/push-subscriptions
 * Get current user's push subscription
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await PushNotificationService.getUserSubscriptions(userId);

    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    console.error('[GET /api/push-subscriptions] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/push-subscriptions
 * Save a push subscription
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, user_type } = body;

    if (!subscription || !user_type) {
      return NextResponse.json({ error: 'subscription and user_type are required' }, { status: 400 });
    }

    if (!['student', 'author'].includes(user_type)) {
      return NextResponse.json({ error: 'user_type must be student or author' }, { status: 400 });
    }

    const success = await PushNotificationService.saveSubscription(userId, subscription, user_type);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/push-subscriptions] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/push-subscriptions
 * Remove push subscription
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await PushNotificationService.removeSubscription(userId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/push-subscriptions] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
