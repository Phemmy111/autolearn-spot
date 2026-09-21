"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Mail, Bell, Save, X, Check } from 'lucide-react';

interface EmailNotification {
  id: string;
  event_type: string;
  recipient_emails: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  'author_application_submitted': 'Author Application Submitted',
  'product_submitted': 'Product Submitted for Review',
  'course_sale': 'Course Sale',
  'withdrawal_request': 'Withdrawal Request',
  'course_purchase': 'Course Purchase',
};

export default function EmailNotificationsPage() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newEventType, setNewEventType] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [editEmails, setEditEmails] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-notifications');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch email notifications');
      }

      setNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const emails = newEmails.split(',').map(email => email.trim()).filter(email => email);

      if (emails.length === 0) {
        setError('At least one email is required');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/email-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: newEventType,
          recipient_emails: emails,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add email notification');
      }

      await fetchNotifications();
      setShowAddForm(false);
      setNewEventType('');
      setNewEmails('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    setError(null);

    try {
      const emails = editEmails.split(',').map(email => email.trim()).filter(email => email);

      if (emails.length === 0) {
        setError('At least one email is required');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/email-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_emails: emails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email notification');
      }

      await fetchNotifications();
      setEditingId(null);
      setEditEmails('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/email-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email notification');
      }

      await fetchNotifications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email notification configuration?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/email-notifications/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete email notification');
      }

      await fetchNotifications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (notification: EmailNotification) => {
    setEditingId(notification.id);
    setEditEmails(notification.recipient_emails.join(', '));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmails('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Email Notifications</h1>
          <p className="text-brand-text/70">Manage who receives email notifications for different events</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Notification
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[var(--card)] rounded-xl border border-brand-border p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Add New Email Notification</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Event Type</label>
              <select
                required
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-3"
              >
                <option value="">Select an event</option>
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Recipient Emails (comma-separated)</label>
              <input
                type="text"
                required
                placeholder="email1@example.com, email2@example.com"
                value={newEmails}
                onChange={(e) => setNewEmails(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-3"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Add Notification'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-[var(--card)] rounded-xl border border-brand-border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-text mb-2">No email notifications configured</h3>
            <p className="text-brand-text/70 mb-4">
              Add your first email notification configuration to get started.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Notification
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="w-5 h-5 text-sky-600" />
                      <h3 className="font-semibold text-brand-text">
                        {EVENT_LABELS[notification.event_type] || notification.event_type}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {editingId === notification.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editEmails}
                          onChange={(e) => setEditEmails(e.target.value)}
                          placeholder="email1@example.com, email2@example.com"
                          className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(notification.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {notification.recipient_emails.map((email, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-bg border border-brand-border rounded-full text-sm"
                            >
                              <Mail className="w-3 h-3 text-brand-text/60" />
                              {email}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-brand-text/50">
                          Last updated: {new Date(notification.updated_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(notification.id, notification.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        notification.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={notification.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(notification)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
