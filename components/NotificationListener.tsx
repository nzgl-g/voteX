'use client';

import { useEffect } from 'react';
import useNotification from '@/hooks/use-notification';
import { toast } from 'sonner'; // Assuming you use sonner for toast notifications based on package.json

interface NotificationListenerProps {
  userId?: string;
}

export const NotificationListener = ({ userId }: NotificationListenerProps) => {
  const { notifications, connected } = useNotification(userId);

  useEffect(() => {
    // Show toast when new notifications arrive
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      if (!latestNotification.read) {
        toast[latestNotification.type || 'info'](
          latestNotification.message,
          {
            id: latestNotification.id,
            description: `Received at ${new Date(latestNotification.timestamp).toLocaleTimeString()}`,
          }
        );
      }
    }
  }, [notifications]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationListener; 