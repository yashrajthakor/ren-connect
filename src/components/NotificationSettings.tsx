import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { 
    requestNotificationPermission, 
    sendTestNotification, 
    permission, 
    isSupported 
  } = usePushNotifications();
  const [testSent, setTestSent] = useState(false);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setTestSent(false);
    }
  };

  const handleSendTest = () => {
    sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          label: 'Enabled',
          color: 'bg-green-500/10 text-green-700 border-green-200',
          icon: CheckCircle,
        };
      case 'denied':
        return {
          label: 'Blocked',
          color: 'bg-red-500/10 text-red-700 border-red-200',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Not Set',
          color: 'bg-gray-500/10 text-gray-700 border-gray-200',
          icon: Bell,
        };
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in your browser.
        </p>
      </Card>
    );
  }

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Receive notifications even when the app is closed
          </p>
        </div>
        <Badge className={`${status.color} border`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="space-y-4">
        {permission !== 'granted' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              {permission === 'denied'
                ? '📳 Notifications are blocked. Check your browser settings to enable them.'
                : '📳 Enable notifications to receive real-time updates on your device.'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {permission !== 'granted' && (
            <Button
              onClick={handleEnableNotifications}
              variant="default"
              className="flex-1"
            >
              Enable Notifications
            </Button>
          )}

          {permission === 'granted' && (
            <>
              <Button
                onClick={handleSendTest}
                variant="outline"
                className="flex-1"
              >
                Send Test Notification
              </Button>
              {testSent && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Test sent!
                </div>
              )}
            </>
          )}
        </div>

        {permission === 'granted' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-900">
            ✅ You will receive notifications for:
            <ul className="mt-2 space-y-1 ml-4">
              <li>• 📌 New leads assigned to you</li>
              <li>• 📋 Updates on your leads</li>
              <li>• 📢 Important announcements</li>
              <li>• ⚙️ Admin updates</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NotificationSettings;
