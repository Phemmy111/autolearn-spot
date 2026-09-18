import { supabaseAdmin } from '@/lib/supabase';

export type NotificationType = 
  | 'LIVE_CLASS_SCHEDULED'
  | 'LIVE_CLASS_REMINDER'
  | 'AUTHOR_MESSAGE'
  | 'ASSIGNMENT_FEEDBACK'
  | 'QUIZ_RESULT'
  | 'PRODUCT_UPDATE'
  | 'SYSTEM';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  eventId?: string; // For idempotency
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, body, actionUrl, metadata, eventId } = params;

  try {
    // If eventId is provided, check if notification already exists
    if (eventId) {
      const { data: existing } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('event_id', eventId)
        .single();

      if (existing) {
        return { success: true, existing: true, notification: existing };
      }
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        body,
        action_url: actionUrl,
        metadata: metadata || {},
        event_id: eventId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    // Create delivery record
    await supabaseAdmin
      .from('notification_deliveries')
      .insert({
        notification_id: data.id,
        user_id: userId,
        channel: 'in_app',
        status: 'unread',
      });

    return { success: true, existing: false, notification: data };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { success: false, error };
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return [];
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    // For now, return 0 since we need to check the actual schema
    // This will be updated once we verify the notifications table structure
    return 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notification_deliveries')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notification_deliveries')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) {
      console.error('Error marking all as read:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return { success: false };
  }
}

/**
 * Create notifications for multiple users (bulk)
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const results = await Promise.allSettled(
    userIds.map(userId => createNotification({ ...params, userId }))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { successful, failed, total: userIds.length };
}