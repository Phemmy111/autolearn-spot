import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class NotificationService {
  /**
   * Create a notification for a partner
   */
  static async createNotification(params: {
    partnerId: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from('partner_notifications').insert({
        partner_id: params.partnerId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
        read: false
      });

      if (error) {
        console.error('[NotificationService] Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Exception in createNotification:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('partner_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('[NotificationService] Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Exception in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a partner
   */
  static async markAllAsRead(partnerId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('partner_notifications')
        .update({ read: true })
        .eq('partner_id', partnerId)
        .eq('read', false);

      if (error) {
        console.error('[NotificationService] Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Exception in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Get notifications for a partner
   */
  static async getNotifications(partnerId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('partner_notifications')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[NotificationService] Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[NotificationService] Exception in getNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread count for a partner
   */
  static async getUnreadCount(partnerId: string): Promise<number> {
    try {
      const { count } = await supabaseAdmin
        .from('partner_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('read', false);

      return count || 0;
    } catch (error) {
      console.error('[NotificationService] Exception in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async deleteOldNotifications(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabaseAdmin
        .from('partner_notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('[NotificationService] Error deleting old notifications:', error);
      }
    } catch (error) {
      console.error('[NotificationService] Exception in deleteOldNotifications:', error);
    }
  }
}