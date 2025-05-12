import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { notificationService, NotificationPayload } from '@/api/notification-service';

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
        const data = await notificationService.getUserNotifications(10, 0);
        setNotifications(data);
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