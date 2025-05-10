'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationSheet } from './notification-sheet';
import { NotificationPayload } from '@/api/notification-service';

type NotificationContextType = {
  notifications: NotificationPayload[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleNotificationClick: (notification: NotificationPayload) => void;
  handleAccept: (notification: NotificationPayload) => void;
  handleDecline: (notification: NotificationPayload) => void;
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
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connection-confirmed', (data) => {
        console.log('Connection confirmed:', data);
        // You could show a toast or some UI indication that the connection is working
      });

      socketInstance.on('new-notification', (notification: NotificationPayload) => {
        console.log('New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(count => count + 1);
      });

      setSocket(socketInstance);

      return () => {
        console.log('Disconnecting socket...');
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  }, []);

  // Listen for mock notifications (for example page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMockNotification = (event: any) => {
      const notification = event.detail;
      console.log('Mock notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
    };

    window.addEventListener('mock-notification', handleMockNotification);

    return () => {
      window.removeEventListener('mock-notification', handleMockNotification);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: NotificationPayload) => {
    // Mark as read logic would go here
    // For now, just mark it as read in the local state
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(count => Math.max(0, count - 1));

    // Close the notification panel
    setIsOpen(false);
  }, []);

  // Handle accept interaction
  const handleAccept = useCallback((notification: NotificationPayload) => {
    console.log('Accept notification:', notification);
    
    // Mark as read in local state
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(count => Math.max(0, count - 1));
  }, []);

  // Handle decline interaction
  const handleDecline = useCallback((notification: NotificationPayload) => {
    console.log('Decline notification:', notification);
    
    // Mark as read in local state
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(count => Math.max(0, count - 1));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
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
        unreadCount={unreadCount}
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