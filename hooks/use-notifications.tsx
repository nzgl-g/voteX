import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { notificationService, Notification } from '@/services/notification-service';

// Define a NotificationPayload interface that combines the old and new notification structures
interface NotificationPayload {
  _id: string;
  id?: string;
  userId?: string;
  type: string;
  title?: string;
  message: string;
  link?: string;
  targetType?: 'user' | 'team' | 'all';
  category?: 'Alert' | 'Interaction';
  timestamp?: string;
  createdAt: string;
  relatedId?: string;
}

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const socketInstance = io('http://localhost:2000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        
        // Authenticate with user ID
        const userId = localStorage.getItem('userId');
        if (userId) {
          socketInstance.emit('authenticate', userId);
        }
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketInstance.on('new-notification', (notification: NotificationPayload) => {
        setNotifications(prev => [notification, ...prev]);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Use the new getNotifications method instead of getUserNotifications
        const data = await notificationService.getNotifications();
        
        // Map the Notification objects to NotificationPayload objects
        const mappedData: NotificationPayload[] = data.map(notification => ({
          _id: notification._id,
          id: notification._id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.relatedId ? `/tasks/${notification.relatedId}` : undefined,
          createdAt: notification.createdAt
        }));
        
        setNotifications(mappedData);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: NotificationPayload) => {
    // Navigate to the link
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  }, [router]);

  // Handle accept interaction
  const handleAccept = useCallback((notification: NotificationPayload) => {
    // Implementation depends on the type of notification
    console.log('Accept notification:', notification);
    // Navigate to appropriate page based on notification type
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  }, [router]);

  // Handle decline interaction
  const handleDecline = useCallback((notification: NotificationPayload) => {
    // Implementation depends on the type of notification
    console.log('Decline notification:', notification);
  }, []);

  return {
    notifications,
    isOpen,
    setIsOpen,
    handleNotificationClick,
    handleAccept,
    handleDecline
  };
} 