import { useEffect, useCallback, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { AppNotification } from './useNotifications';

export type NotificationPermission = 'granted' | 'denied' | 'default';

// VAPID public key — safe to ship to the client (it's the public half of the keypair).
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BB8OSut1MBz1OVYJDicC5sCaNTigZURhZPYlp3yLimMtLcQk0Nrka9IXGdF6n60Waov-OwW7vHqzZYA24XvDYbk';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

/**
 * Hook to manage push notifications in PWA
 * - Requests notification permission
 * - Subscribes the device to Web Push (via VAPID) and stores the subscription server-side
 * - Falls back to in-tab realtime notifications when the app is open
 */
export const usePushNotifications = () => {
  const { user } = useAuthContext();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    if (supported) {
      setPermission((Notification.permission as NotificationPermission) || 'default');
    }
  }, []);

  // Subscribe this device to Web Push and persist the subscription to Supabase.
  // Safe to call multiple times — pushManager.subscribe is idempotent.
  const subscribeToPush = useCallback(async () => {
    if (!user?.id) return null;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported in this browser');
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }
      const json = sub.toJSON();
      const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey('p256dh'));
      const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey('auth'));

      await supabase.from('push_subscriptions' as any).upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );
      setIsSubscribed(true);
      return sub;
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      return null;
    }
  }, [user?.id]);

  // Request notification permission from user (with mobile optimization)
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      await subscribeToPush();
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      console.log('Notifications denied by user');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);

      if (result === 'granted') {
        await subscribeToPush();
      }

      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [subscribeToPush]);

  // Show push notification (works on both mobile and desktop PWAs)
  const showPushNotification = useCallback((notification: AppNotification) => {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Map notification type to user-friendly title
    const typeLabels: Record<string, string> = {
      lead_received: '📌 New Lead',
      lead_updated: '📋 Lead Updated',
      business_closed: '✅ Business Closed',
      announcement: '📢 Announcement',
      admin_update: '⚙️ Admin Update',
      new_application: '🔔 New Member Application',
      new_ask: '💬 New Ask',
      ask_updated: '✏️ Ask Updated',
      ask_resolved: '✅ Ask Resolved',
    };

    const title = typeLabels[notification.type] || notification.title;
    const options: NotificationOptions & { vibrate?: number[]; actions?: any[] } = {
      body: notification.body || 'New notification from RBN',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: notification.id,
      data: {
        link: notification.link || '/dashboard/notifications',
        notificationId: notification.id,
      },
      requireInteraction: notification.type === 'announcement' ? true : false,
      vibrate: [200, 100, 200], // Mobile vibration pattern
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    // Show through the registered service worker so it works identically on mobile/desktop.
    // Background push (app closed) is handled separately by the SW's 'push' event listener.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, options))
        .catch((err) => {
          console.error('SW showNotification failed:', err);
          try { new Notification(title, options); } catch (e) { console.error(e); }
        });
    } else {
      try { new Notification(title, options); } catch (e) { console.error(e); }
    }
  }, []);

  // Test notification function
  const sendTestNotification = useCallback(() => {
    if (Notification.permission !== 'granted') {
      console.log('Please enable notifications first');
      return;
    }

    const testNotification: AppNotification = {
      id: `test-${Date.now()}`,
      user_id: user?.id || '',
      type: 'announcement',
      title: '🎉 Test Notification',
      body: 'This is a test notification from RBN. Click to see details!',
      link: '/dashboard/notifications',
      metadata: { test: true },
      read_at: null,
      created_at: new Date().toISOString(),
    };

    showPushNotification(testNotification);
  }, [user?.id, showPushNotification]);

  // On login: ensure permission + push subscription, and listen for in-tab realtime inserts
  useEffect(() => {
    if (!user?.id) return;

    // If permission already granted, refresh the subscription so this device is registered.
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush();
    }

    // Subscribe to new notifications in real-time
    const channel = supabase
      .channel(`notifications-push-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as AppNotification;
          // In-tab fallback. When the app is closed, the SW 'push' handler shows it instead.
          showPushNotification(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showPushNotification, subscribeToPush]);

  return {
    requestNotificationPermission,
    showPushNotification,
    sendTestNotification,
    subscribeToPush,
    permission,
    isSupported,
    isSubscribed,
  };
};
