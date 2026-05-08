import { useEffect, useCallback, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { AppNotification } from './useNotifications';

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * Hook to manage push notifications in PWA
 * - Requests notification permission
 * - Subscribes to real-time notifications
 * - Shows push notifications when new notifications arrive
 * - Supports mobile push notifications through service workers
 */
export const usePushNotifications = () => {
  const { user } = useAuthContext();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    if (supported) {
      setPermission((Notification.permission as NotificationPermission) || 'default');
    }
  }, []);

  // Request notification permission from user (with mobile optimization)
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      console.log('Notifications denied by user');
      return false;
    }

    try {
      // Request permission (works on mobile browsers and desktop)
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      
      if (result === 'granted') {
        console.log('Notification permission granted');
        // Register service worker if not already registered (important for mobile)
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.ready;
            console.log('Service worker ready for notifications');
          } catch (err) {
            console.error('Service worker registration failed:', err);
          }
        }
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

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
    };

    const title = typeLabels[notification.type] || notification.title;
    const options: NotificationOptions = {
      body: notification.body || 'New notification from REN',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: notification.id,
      data: {
        link: notification.link || '/dashboard/notifications',
        notificationId: notification.id,
      },
      requireInteraction: notification.type === 'announcement' ? true : false,
      vibrate: [200, 100, 200], // Mobile vibration pattern
    };

    // Show notification through service worker (best for mobile PWAs)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options,
        });
      } catch (error) {
        console.error('Failed to post message to service worker:', error);
        // Fallback to direct notification
        try {
          new Notification(title, options);
        } catch (err) {
          console.error('Failed to show notification:', err);
        }
      }
    } else {
      // Fallback to direct notification (less reliable on mobile)
      try {
        new Notification(title, options);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
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
      body: 'This is a test notification from REN. Click to see details!',
      link: '/dashboard/notifications',
      metadata: { test: true },
      read_at: null,
      created_at: new Date().toISOString(),
    };

    showPushNotification(testNotification);
  }, [user?.id, showPushNotification]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    // Request permission on first load
    requestNotificationPermission();

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
          // Show push notification when new notification arrives
          showPushNotification(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showPushNotification, requestNotificationPermission]);

  return { 
    requestNotificationPermission, 
    showPushNotification, 
    sendTestNotification,
    permission,
    isSupported,
  };
};
