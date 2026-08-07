"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  CreditCard, 
  ShieldAlert,
  Trash2,
  RefreshCw,
  Filter
} from "lucide-react";

const notificationIcons: Record<string, any> = {
  new_registration: Users,
  payment_received: DollarSign,
  scholarship_payment: DollarSign,
  partner_application: Users,
  partner_approved: CheckCircle2,
  influencer_created: Users,
  withdrawal_request: CreditCard,
  withdrawal_paid: CheckCircle2,
  fraud_alert: ShieldAlert,
  webhook_failure: XCircle,
  email_failure: XCircle,
  system_error: AlertTriangle,
};

const notificationColors: Record<string, string> = {
  new_registration: 'text-blue-400 bg-blue-500/10',
  payment_received: 'text-green-400 bg-green-500/10',
  scholarship_payment: 'text-purple-400 bg-purple-500/10',
  partner_application: 'text-yellow-400 bg-yellow-500/10',
  partner_approved: 'text-green-400 bg-green-500/10',
  influencer_created: 'text-cyan-400 bg-cyan-500/10',
  withdrawal_request: 'text-orange-400 bg-orange-500/10',
  withdrawal_paid: 'text-green-400 bg-green-500/10',
  fraud_alert: 'text-red-400 bg-red-500/10',
  webhook_failure: 'text-red-400 bg-red-500/10',
  email_failure: 'text-red-400 bg-red-500/10',
  system_error: 'text-red-400 bg-red-500/10',
};

export default function FounderNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/founder-notifications');
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifications(result.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/founder-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id }),
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/admin/founder-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/admin/founder-notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read_at) return false;
    if (filter === 'read' && !n.read_at) return false;
    if (typeFilter !== 'all' && n.notification_type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[bg-[var(--card)]] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-[text-[var(--primary)]]" />
          <span className="text-[text-[var(--text-muted)]]">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[bg-[var(--card)]] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-8 w-8 text-[text-[var(--primary)]]" />
              <h1 className="text-3xl font-bold">Founder Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-[text-[var(--primary)]] text-black px-3 py-1 rounded-full text-sm font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[text-[var(--text-muted)]]">Real-time notifications for important business events</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] rounded-lg hover:border-[text-[var(--primary)]] hover:text-[text-[var(--primary)]] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark All Read
            </button>
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-2 px-4 py-2 border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] rounded-lg hover:border-[text-[var(--primary)]] hover:text-[text-[var(--primary)]] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[text-[var(--text-muted)]]" />
            <span className="text-sm text-[text-[var(--text-muted)]]">Filter:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-[text-[var(--primary)]] text-black' 
                  : 'bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] hover:bg-[border-[var(--border-default)]]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-[text-[var(--primary)]] text-black' 
                  : 'bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] hover:bg-[border-[var(--border-default)]]'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read' 
                  ? 'bg-[text-[var(--primary)]] text-black' 
                  : 'bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] hover:bg-[border-[var(--border-default)]]'
              }`}
            >
              Read
            </button>
          </div>

          <div className="w-px h-6 bg-[border-[var(--border-default)]]" />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] rounded-lg px-3 py-1 text-sm text-[text-[var(--text-muted)]] focus:border-[text-[var(--primary)]] focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="new_registration">New Registration</option>
            <option value="payment_received">Payment Received</option>
            <option value="scholarship_payment">Scholarship Payment</option>
            <option value="partner_application">Partner Application</option>
            <option value="partner_approved">Partner Approved</option>
            <option value="influencer_created">Influencer Created</option>
            <option value="withdrawal_request">Withdrawal Request</option>
            <option value="withdrawal_paid">Withdrawal Paid</option>
            <option value="fraud_alert">Fraud Alert</option>
            <option value="webhook_failure">Webhook Failure</option>
            <option value="email_failure">Email Failure</option>
            <option value="system_error">System Error</option>
          </select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.notification_type] || Bell;
              const colorClass = notificationColors[notification.notification_type] || 'text-[text-[var(--text-muted)]] bg-[border-[var(--border-default)]]';
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  className={`bg-[bg-[var(--card)]] border rounded-xl p-6 transition-all ${
                    isUnread 
                      ? 'border-[text-[var(--primary)]]/30 bg-[text-[var(--primary)]]/5' 
                      : 'border-[border-[var(--border-default)]]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{notification.subject}</h3>
                          <p className="text-sm text-[text-[var(--text-muted)]]">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-[text-[var(--text-muted)]] hover:text-[text-[var(--primary)]] transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-[text-[var(--text-muted)]] hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className="text-sm text-[text-[var(--text-muted)]] mt-3 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: notification.content }}
                      />
                      
                      {notification.status === 'failed' && notification.error_message && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-400">
                            <strong>Error:</strong> {notification.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] rounded-xl p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-[text-[var(--text-muted)]] opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-[text-[var(--text-muted)]]">
              {filter === 'unread' 
                ? 'No unread notifications' 
                : filter === 'read' 
                ? 'No read notifications' 
                : 'No notifications yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}