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
    // Establish WebSocket connection
    const socketInstance = io("http://localhost:2000"); // Using the port from your server setup

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

    // Listen for new notifications
    socketInstance.on("new-notification", (payload: NotificationPayload) => {
      console.log("New notification received:", payload);
      setNotifications(prev => [payload, ...prev]);
    });

    setSocket(socketInstance);

    // Clean up the socket connection on component unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

};

export default useNotification; 