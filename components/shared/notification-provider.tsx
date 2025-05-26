'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationSheet } from './notification-sheet';
import { Notification, notificationService } from '@/services/notification-service';
import { toast } from 'sonner';
import baseApi from '@/services/base-api';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (notification: Notification) => Promise<void>;
  handleNotificationClick: (notification: Notification) => Promise<void>;
  handleAccept: (notification: Notification) => void;
  handleDecline: (notification: Notification) => void;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications from the service
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const notificationsData = await notificationService.getNotifications();
      setNotifications(notificationsData);
      
      // Calculate unread count
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (currentUserId) {
        const unread = notificationsData.filter(n => !n.readBy.includes(currentUserId)).length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error.message);
    }
  }, []);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initial fetch
    fetchNotifications();
    
    // Set up periodic fetching (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification._id);
      
      // Update local state
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (!currentUserId) return;
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id 
            ? { ...n, readBy: [...n.readBy, currentUserId] } 
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error.message);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification);
    
    // Navigate to link if provided
    if (notification.link) {
      window.location.href = notification.link;
    }
  }, [markAsRead]);

  // Initialize socket connection
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get user information
      let userId;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user._id;
        } catch (e) {
          console.error('Failed to parse user data from localStorage:', e);
          return;
        }
      }

      if (!userId) return;

      const socketInstance = io('http://localhost:2000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        socketInstance.emit('authenticate', userId);
      });

      socketInstance.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('new-notification', (notification: Notification) => {
        // Add notification to state
        setNotifications(prev => [notification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast(
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {notification.category}: {notification.type.replace(/-/g, ' ')}
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-center',
            className: 'bg-background border border-border shadow-md rounded-lg',
            action: {
              label: "View",
              onClick: () => setIsOpen(true)
            },
          }
        );
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch (error: any) {
      console.error('Failed to connect to socket:', error);
    }
  }, []);

  // Handle accept interaction
  const handleAccept = useCallback(async (notification: Notification) => {
    try {
      // Mark as read
      await markAsRead(notification);
      
      // Handle specific notification types
      if (notification.type === 'team-invite') {
        // Extract invitation ID from extraData
        const invitationId = notification.extraData?.invitationId;
        
        if (invitationId) {
          try {
            // Use a try-catch with fetch instead of axios to avoid error handling issues
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:2000/votex/api/invitations/${invitationId}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token || ''
              }
            });
            
            // Check if response is ok (status in the range 200-299)
            if (response.ok) {
              // Show success toast
              toast.success("Team Invitation Accepted", {
                description: "You have successfully joined the team.",
              });
              
              // Refresh the page if we're on a team page
              if (window.location.pathname.includes('/team')) {
                window.location.reload();
              } else if (notification.link) {
                // Navigate to the team page
                window.location.href = notification.link;
              }
            } else {
              // Get response text safely
              let responseText = '';
              try {
                responseText = await response.text() || '';
              } catch (e) {
                console.error('Failed to read response text:', e);
              }
              
              // Check for specific messages
              if (responseText && (responseText.includes('already in team') || responseText.includes('already processed'))) {
                toast.success("Already a Team Member", {
                  description: "You are already a member of this team.",
                });
                
                // Still navigate to team page
                if (notification.link) {
                  window.location.href = notification.link;
                }
              } else {
                // Show error toast for other errors
                toast.error("Error Accepting Invitation", {
                  description: responseText || "An error occurred while accepting the invitation.",
                });
              }
            }
          } catch (error: any) {
            console.error('Failed to accept invitation:', error);
            toast.error("Connection Error", {
              description: "Could not connect to the server. Please try again later.",
            });
          }
        } else {
          toast.error("Error Accepting Invitation", {
            description: "Invitation details not found.",
          });
        }
      } else if (notification.link) {
        // For other notification types, just navigate to the link
        window.location.href = notification.link;
      }
    } catch (error: any) {
      console.error('Failed to process notification action:', error);
      toast.error("Action Failed", {
        description: "Failed to process your request.",
      });
    }
    
    // Close notification panel
    setIsOpen(false);
  }, [markAsRead]);

  // Handle decline interaction
  const handleDecline = useCallback(async (notification: Notification) => {
    try {
      // Mark as read
      await markAsRead(notification);
      
      // Handle specific notification types
      if (notification.type === 'team-invite') {
        // Extract invitation ID from extraData
        const invitationId = notification.extraData?.invitationId;
        
        if (invitationId) {
          try {
            // Use fetch instead of axios to avoid error handling issues
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:2000/votex/api/invitations/${invitationId}/decline`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token || ''
              }
            });
            
            if (response.ok) {
              // Show success toast
              toast.success("Team Invitation Declined", {
                description: "You have declined the team invitation.",
              });
            } else {
              // Get response text safely
              let responseText = '';
              try {
                responseText = await response.text() || '';
              } catch (e) {
                console.error('Failed to read response text:', e);
              }
              
              // Check for specific messages
              if (responseText && responseText.includes('already processed')) {
                toast.success("Invitation Already Processed", {
                  description: "This invitation has already been processed.",
                });
              } else {
                // Show error toast for other errors
                toast.error("Error Declining Invitation", {
                  description: responseText || "An error occurred while declining the invitation.",
                });
              }
            }
          } catch (error: any) {
            console.error('Failed to decline invitation:', error);
            toast.error("Connection Error", {
              description: "Could not connect to the server. Please try again later.",
            });
          }
        } else {
          toast.error("Error Declining Invitation", {
            description: "Invitation details not found.",
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to process notification action:', error);
      toast.error("Action Failed", {
        description: "Failed to process your request.",
      });
    }
    
    // Close notification panel
    setIsOpen(false);
  }, [markAsRead]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
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
      />
    </NotificationContext.Provider>
  );
} 