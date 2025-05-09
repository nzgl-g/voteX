import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { notificationService, NotificationPayload } from '@/api/notification-service';

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io('http://localhost:2000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      
      // Authenticate with user ID
      const userId = localStorage.getItem('userId');
      if (userId) {
        socketInstance.emit('authenticate', userId);
      }
    });

    socketInstance.on('new-notification', (notification: NotificationPayload) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getUserNotifications(10, 0);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: NotificationPayload) => {
    // Mark as read
    if (!notification.read) {
      notificationService.markAsRead(notification.id)
        .then(() => {
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
          setUnreadCount(count => Math.max(0, count - 1));
        })
        .catch(error => console.error('Failed to mark notification as read:', error));
    }

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
    
    // Mark as read
    notificationService.markAsRead(notification.id)
      .then(() => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(count => Math.max(0, count - 1));
      });
      
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
    
    // Mark as read
    notificationService.markAsRead(notification.id)
      .then(() => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(count => Math.max(0, count - 1));
      });
  }, []);

  return {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    handleNotificationClick,
    handleAccept,
    handleDecline
  };
} 