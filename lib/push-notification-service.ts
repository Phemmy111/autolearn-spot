import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = 'mailto:autolearnspot@gmail.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('[PushNotificationService] VAPID keys not configured. Push notifications will not work.');
}

// Configure webpush
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  /**
   * Save a push subscription for a user
   */
  static async saveSubscription(
    userId: string,
    subscription: PushSubscription,
    userType: 'student' | 'author'
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription as any,
          user_type: userType,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[PushNotificationService] Failed to save subscription:', error);
        return false;
      }

      console.log('[PushNotificationService] Subscription saved for user:', userId);
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Error saving subscription:', error);
      return false;
    }
  }

  /**
   * Remove a push subscription for a user
   */
  static async removeSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[PushNotificationService] Failed to remove subscription:', error);
        return false;
      }

      console.log('[PushNotificationService] Subscription removed for user:', userId);
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Error removing subscription:', error);
      return false;
    }
  }

  /**
   * Get subscriptions for a specific user
   */
  static async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId);

      if (error) {
        console.error('[PushNotificationService] Failed to get subscriptions:', error);
        return [];
      }

      return data?.map((item: any) => item.subscription) || [];
    } catch (error) {
      console.error('[PushNotificationService] Error getting subscriptions:', error);
      return [];
    }
  }

  /**
   * Get subscriptions for a specific user type
   */
  static async getUserTypeSubscriptions(userType: 'student' | 'author'): Promise<{ userId: string; subscription: PushSubscription }[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id, subscription')
        .eq('user_type', userType);

      if (error) {
        console.error('[PushNotificationService] Failed to get user type subscriptions:', error);
        return [];
      }

      return data?.map((item: any) => ({
        userId: item.user_id,
        subscription: item.subscription
      })) || [];
    } catch (error) {
      console.error('[PushNotificationService] Error getting user type subscriptions:', error);
      return [];
    }
  }

  /**
   * Send push notification to a specific user
   */
  static async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): Promise<boolean> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        console.log('[PushNotificationService] No subscriptions found for user:', userId);
        return false;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/autolearn-brandmark.png',
        badge: notification.badge || '/autolearn-brandmark.png',
        data: notification.data || {},
      });

      const results = await Promise.allSettled(
        subscriptions.map((subscription) =>
          webpush.sendNotification(subscription, payload)
        )
      );

      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('[PushNotificationService] Some notifications failed:', failures);
        // Remove failed subscriptions
        await this.removeFailedSubscriptions(subscriptions, failures);
      }

      console.log('[PushNotificationService] Notification sent to user:', userId);
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendNotificationToUsers(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.sendNotification(userId, notification);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Send push notification to all users of a specific type
   */
  static async sendNotificationToUserType(
    userType: 'student' | 'author',
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): Promise<{ success: number; failed: number }> {
    const subscriptions = await this.getUserTypeSubscriptions(userType);
    const userIds = [...new Set(subscriptions.map((s) => s.userId))];

    return await this.sendNotificationToUsers(userIds, notification);
  }

  /**
   * Remove failed subscriptions
   */
  private static async removeFailedSubscriptions(
    allSubscriptions: PushSubscription[],
    failures: PromiseSettledResult<void>[]
  ): Promise<void> {
    const failedSubscriptions = allSubscriptions.filter((_, index) =>
      failures[index]?.status === 'rejected'
    );

    for (const subscription of failedSubscriptions) {
      // Find which user has this subscription and remove it
      const { data } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id')
        .eq('subscription', subscription as any)
        .single();

      if (data) {
        await this.removeSubscription(data.user_id);
      }
    }
  }

  /**
   * Send new message notification
   */
  static async sendNewMessageNotification(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
  ): Promise<boolean> {
    return this.sendNotification(recipientUserId, {
      title: `New message from ${senderName}`,
      body: messagePreview,
      data: {
        type: 'new_message',
        conversationId,
        senderName,
      },
    });
  }
}
