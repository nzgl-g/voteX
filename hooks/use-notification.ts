import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type NotificationPayload = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  read: boolean;
  data?: any;
};

export const useNotification = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Don't try to connect if no userId is provided
    if (!userId) return;
    
    try {
      // Establish WebSocket connection
      const socketInstance = io("http://localhost:2000", {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on("connect", () => {
        setConnected(true);
        console.log("Connected to notification service");
        
        // Authenticate with userId if available
        if (userId) {
          socketInstance.emit("authenticate", userId);
        }
      });

      socketInstance.on("disconnect", () => {
        setConnected(false);
        console.log("Disconnected from notification service");
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnected(false);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnected(false);
      });

      // Listen for new notifications
      socketInstance.on("new-notification", (payload: NotificationPayload) => {
        console.log("New notification received:", payload);
        setNotifications(prev => [payload, ...prev]);
      });

      // Add the new notification event listener as requested by backend
      socketInstance.on("newNotification", (data) => {
        console.log("🔔 New Notification:", data);
        const newNotification: NotificationPayload = {
          id: data.id || new Date().toISOString(),
          message: data.message,
          type: data.type || 'info',
          timestamp: data.timestamp || new Date().toISOString(),
          read: false,
          data: data
        };
        setNotifications(prev => [newNotification, ...prev]);
      });

      setSocket(socketInstance);

      // Clean up the socket connection on component unmount
      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  }, [userId]);

  // Return the state values so they can be used in components
  return {
    notifications,
    connected,
    socket,
    clearNotifications: () => setNotifications([]),
    markAsRead: (id: string) => {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    }
  };
};

export default useNotification; 