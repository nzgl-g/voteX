'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationSheet } from './notification-sheet';
import { Notification, notificationService } from '@/services/notification-service';

// Extended notification type with UI-specific properties
type NotificationWithUI = Notification & {
  category?: 'Interaction' | 'Information';
  timestamp?: string;
  id?: string; // For backward compatibility with UI
};

type NotificationContextType = {
  notifications: NotificationWithUI[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleNotificationClick: (notification: NotificationWithUI) => void;
  handleAccept: (notification: NotificationWithUI) => void;
  handleDecline: (notification: NotificationWithUI) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationWithUI[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications from the service
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found, cannot fetch notifications');
      return;
    }

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const notificationsData = await notificationService.getNotifications();
        // Transform to UI format
        const uiNotifications = notificationsData.map(notification => {
          const notificationWithUI: NotificationWithUI = {
            ...notification,
            id: notification._id, // For backward compatibility with UI
            category: notification.type === 'invitation' ? 'Interaction' as const : 'Information' as const,
            timestamp: notification.createdAt
          };
          return notificationWithUI;
        });
        setNotifications(uiNotifications);
      } catch (error: any) {
        console.error('Failed to fetch notifications:', error.message);
      }
    };
    fetchNotifications();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, cannot connect to socket');
        return;
      }

      // Get user information
      let userId;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user._id;
          console.log('User ID for socket authentication:', userId);
        } catch (e) {
          console.error('Failed to parse user data from localStorage:', e);
        }
      }

      if (!userId) {
        console.log('No user ID found, cannot authenticate socket');
        return;
      }

      console.log('Connecting to socket.io server...');
      const socketInstance = io('http://localhost:2000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance.id);
        setIsConnected(true);
        
        // Authenticate with user ID
        socketInstance.emit('authenticate', userId);
        console.log('Sent authentication with user ID:', userId);
      });

      socketInstance.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
      });

      socketInstance.on('error', (error: Error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connection-confirmed', (data: any) => {
        console.log('Connection confirmed:', data);
        // You could show a toast or some UI indication that the connection is working
      });

      socketInstance.on('new-notification', (notification: Notification) => {
        console.log('New notification received:', notification);
        
        // Transform to UI format
        const uiNotification: NotificationWithUI = {
          ...notification,
          id: notification._id, // For backward compatibility with UI
          category: notification.type === 'invitation' ? 'Interaction' as const : 'Information' as const,
          timestamp: notification.createdAt
        };
        
        setNotifications(prev => [uiNotification, ...prev]);
      });

      setSocket(socketInstance);

      return () => {
        console.log('Disconnecting socket...');
        socketInstance.disconnect();
      };
    } catch (error: any) {
      console.error('Failed to connect to socket:', error);
    }
  }, []);

  // Listen for mock notifications (for example page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMockNotification = (event: CustomEvent) => {
      const notification = event.detail as NotificationWithUI;
      console.log('Mock notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
    };

    window.addEventListener('mock-notification', handleMockNotification as EventListener);

    return () => {
      window.removeEventListener('mock-notification', handleMockNotification as EventListener);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: NotificationWithUI) => {
    // Only close the notification panel and navigate, no markAsRead
    setIsOpen(false);
  }, []);

  // Handle accept interaction
  const handleAccept = useCallback(async (notification: NotificationWithUI) => {
    // Only close the notification panel and log, no markAsRead
    setIsOpen(false);
    console.log('Accept notification:', notification);
  }, []);

  // Handle decline interaction
  const handleDecline = useCallback(async (notification: NotificationWithUI) => {
    // Only close the notification panel and log, no markAsRead
    setIsOpen(false);
    console.log('Decline notification:', notification);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isOpen,
        setIsOpen,
        handleNotificationClick,
        handleAccept,
        handleDecline
      }}
    >
      {children}
      <NotificationSheet
        notifications={notifications}
        open={isOpen}
        setOpen={setIsOpen}
        onNotificationClick={handleNotificationClick}
        onAccept={handleAccept}
        onDecline={handleDecline}
        triggerClassName="hidden" // Hide the trigger since we're using a separate button
      />
    </NotificationContext.Provider>
  );
} 