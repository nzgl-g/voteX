import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type NotificationPayload = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  data?: any;
};

export const useNotification = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const socketInstance = io('http://localhost:2000', {
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        setConnected(true);
        if (userId) {
          socketInstance.emit('authenticate', userId);
        }
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      socketInstance.on("newNotification", (data) => {
        console.log("🔔 New Notification:", data);
        const newNotification: NotificationPayload = {
          id: data.id || new Date().toISOString(),
          message: data.message,
          type: data.type || 'info',
          timestamp: data.timestamp || new Date().toISOString(),
          data: data
        };
        setNotifications(prev => [newNotification, ...prev]);
      });

      setSocket(socketInstance);

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
    clearNotifications: () => setNotifications([])
  };
};

export default useNotification; 