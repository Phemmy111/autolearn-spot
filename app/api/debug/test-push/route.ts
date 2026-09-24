import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const results: any = {};

  // 1. Check VAPID configuration
  results.vapidConfig = {
    hasPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    publicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length,
    publicKeyPrefix: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20),
    hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
    privateKeyLength: process.env.VAPID_PRIVATE_KEY?.length,
  };

  // 2. Try to configure webpush
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:femiadeleке2020@gmail.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      results.vapidConfig.configured = true;
    } else {
      results.vapidConfig.configured = false;
      results.vapidConfig.error = 'Missing VAPID keys';
    }
  } catch (error: any) {
    results.vapidConfig.configured = false;
    results.vapidConfig.error = error.message;
  }

  // 3. Get existing push subscriptions
  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .limit(5);

    results.subscriptions = {
      success: !error,
      count: subscriptions?.length || 0,
      sample: subscriptions?.slice(0, 2) || [],
      error: error?.message
    };
  } catch (error: any) {
    results.subscriptions = {
      success: false,
      error: error.message
    };
  }

  // 4. Try to send a test push notification
  if (results.subscriptions.success && results.subscriptions.count > 0) {
    try {
      const testSubscription = results.subscriptions.sample[0];
      const subscriptionData = testSubscription.subscription;

      results.testPush = {
        attempting: true,
        subscriptionEndpoint: subscriptionData.endpoint?.substring(0, 50) + '...',
      };

      const payload = JSON.stringify({
        title: 'Test Push Notification',
        body: 'This is a test to verify push notifications are working',
        icon: '/autolearn-brandmark.png'
      });

      await webpush.sendNotification(subscriptionData, payload);

      results.testPush.success = true;
      results.testPush.message = 'Test push sent successfully';
    } catch (error: any) {
      results.testPush.success = false;
      results.testPush.error = error.message;
      results.testPush.errorCode = error.statusCode;
      results.testPush.errorDetails = {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        body: error.body
      };
    }
  } else {
    results.testPush = {
      skipped: true,
      reason: 'No subscriptions available to test'
    };
  }

  return NextResponse.json(results);
}
