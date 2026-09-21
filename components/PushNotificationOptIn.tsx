"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

interface PushNotificationOptInProps {
  userType: 'student' | 'author';
  className?: string;
}

export default function PushNotificationOptIn({ userType, className = '' }: PushNotificationOptInProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if browser supports push notifications
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    // Check current permission
    setPermission(Notification.permission);

    // Show banner if permission is default and we haven't asked before
    const hasAskedBefore = localStorage.getItem(`push_notification_asked_${userType}`);
    if (Notification.permission === 'default' && !hasAskedBefore) {
      setShowBanner(true);
    }
  }, [userType]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support push notifications');
      return;
    }

    setLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        localStorage.setItem(`push_notification_asked_${userType}`, 'true');
        setShowBanner(false);
      } else {
        localStorage.setItem(`push_notification_asked_${userType}`, 'true');
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Send subscription to server
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          user_type: userType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      console.log('Push notification subscription saved successfully');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      // Don't fail the permission grant if subscription fails
    }
  };

  const dismissBanner = () => {
    localStorage.setItem(`push_notification_asked_${userType}`, 'true');
    setShowBanner(false);
  };

  if (permission === 'unsupported') {
    return null;
  }

  if (permission === 'granted') {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <Bell className="w-4 h-4" />
        <span>Notifications enabled</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span>Notifications blocked</span>
      </div>
    );
  }

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-4 right-4 max-w-md bg-[var(--card)] border border-brand-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Bell className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-brand-text mb-1">Enable Notifications</h3>
              <p className="text-sm text-brand-text/70 mb-3">
                Get notified when you receive new messages, even when you're not actively using the chat.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestPermission}
                  disabled={loading}
                  className="px-3 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enabling...' : 'Enable Notifications'}
                </button>
                <button
                  onClick={dismissBanner}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
