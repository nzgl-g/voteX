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
  const [hasError, setHasError] = useState(false);

  // Reset error state if needed
  useEffect(() => {
    if (hasError) {
      // Try to recover after 30 seconds
      const timer = setTimeout(() => {
        setHasError(false);
        fetchNotifications();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  // Fetch notifications from the service
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get the current user ID - Add better error handling
      let currentUserId;
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.warn('User data not found in localStorage');
          return;
        }
        
        const userData = JSON.parse(userStr);
        currentUserId = userData?._id;
        
        if (!currentUserId) {
          console.warn('User ID not found in user data', userData);
          return;
        }
      } catch (err) {
        console.warn('Error parsing user data from localStorage', err);
        return;
      }

      // Use fetch directly for better error handling
      const response = await fetch('http://localhost:2000/votex/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch notifications, status:', response.status);
        return;
      }

      const notificationsData = await response.json();
      
      // Ensure all notifications have a readBy array
      const sanitizedNotifications = notificationsData.map((notification: Notification) => ({
        ...notification,
        readBy: Array.isArray(notification.readBy) ? notification.readBy : []
      }));
      
      setNotifications(sanitizedNotifications);
      
      // Calculate unread count safely
      const unread = sanitizedNotifications.filter(
        (n: Notification) => !n.readBy.includes(currentUserId)
      ).length;
      
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
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
      // Get the current user ID - Add better error handling
      let currentUserId;
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.warn('User data not found in localStorage');
          return;
        }
        
        const userData = JSON.parse(userStr);
        currentUserId = userData?._id;
        
        if (!currentUserId) {
          console.warn('User ID not found in user data', userData);
          return;
        }
      } catch (err) {
        console.warn('Error parsing user data from localStorage', err);
        return;
      }

      if (!notification._id) {
        console.error('Missing notification ID');
        return;
      }
      
      // Check if already read to avoid unnecessary API calls
      if (notification.readBy && notification.readBy.includes(currentUserId)) {
        return; // Already read, no need to mark again
      }
      
      // Optimistically update UI first for better UX
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id 
            ? { ...n, readBy: [...(n.readBy || []), currentUserId] } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Make the API call to mark as read
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:2000/votex/api/notifications/${notification._id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        }
      });
      
      // If the API call failed, revert the optimistic update by refreshing notifications
      if (!response.ok) {
        console.error('Failed to mark notification as read, status:', response.status);
        fetchNotifications(); // Refresh to get the correct state
      }
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      // Refresh notifications to ensure UI is consistent with server state
      fetchNotifications();
    }
  }, [fetchNotifications]);

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

      // Get user information with better error handling
      let userId;
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.warn('User data not found in localStorage for socket connection');
          return;
        }
        
        const userData = JSON.parse(userStr);
        userId = userData?._id;
        
        if (!userId) {
          console.warn('User ID not found in user data for socket connection', userData);
          return;
        }
      } catch (err) {
        console.warn('Error parsing user data from localStorage for socket connection', err);
        return;
      }

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
        // Ensure notification has a valid readBy array
        const sanitizedNotification = {
          ...notification,
          readBy: Array.isArray(notification.readBy) ? notification.readBy : []
        };
        
        // Add notification to state
        setNotifications(prev => [sanitizedNotification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Show a toast notification at the top for new notifications
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
            className: 'bg-background border border-border shadow-md rounded-lg'
            // No action button - purely informational
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
      // Extract important data first, before any async operations
      const invitationId = notification.type === 'team-invite' ? notification.extraData?.invitationId : null;
      const notificationLink = notification.link;
      
      // Only try to mark as read, but continue even if it fails
      try {
        await markAsRead(notification);
      } catch (readError) {
        // Log error but continue with the process
        console.error('Failed to mark notification as read:', readError);
        // No need to show error toast for this minor issue
      }
      
      // Handle specific notification types
      if (notification.type === 'team-invite') {
        // Verify we have a valid invitation ID
        if (invitationId && typeof invitationId === 'string' && invitationId.length > 0) {
          try {
            // Use a try-catch with fetch instead of axios to avoid error handling issues
            const token = localStorage.getItem('token');
            
            // Remove any existing toast first
            toast.dismiss();
            
            // Show loading state
            const loadingToastId = toast.loading("Processing invitation...");
            
            const response = await fetch(`http://localhost:2000/votex/api/invitations/${invitationId}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token || ''
              }
            });
            
            // Dismiss the loading toast
            toast.dismiss(loadingToastId);
            
            // Check if response is ok (status in the range 200-299)
            if (response.ok) {
              // Parse the response to get session information if available
              let sessionId = '';
              let teamId = '';
              try {
                const responseData = await response.json();
                console.log('Server response data:', responseData);
                
                // Try to extract session ID and team ID from various possible locations
                if (responseData && responseData.sessionId) {
                  sessionId = responseData.sessionId;
                } else if (responseData && responseData.invitation && responseData.invitation.sessionId) {
                  sessionId = responseData.invitation.sessionId;
                }
                
                if (responseData && responseData.teamId) {
                  teamId = responseData.teamId;
                } else if (responseData && responseData.invitation && responseData.invitation.teamId) {
                  teamId = responseData.invitation.teamId;
                } else if (responseData && responseData._id) {
                  // Some APIs might return the team ID directly
                  teamId = responseData._id;
                }
                
                console.log('Extracted sessionId:', sessionId);
                console.log('Extracted teamId:', teamId);
              } catch (e) {
                console.error('Failed to parse response JSON:', e);
              }
              
              // Show success toast using the global toast
              toast.success("Team Invitation Accepted", {
                description: "You have successfully joined the team."
              });
              
              // Wait a moment before navigation to allow toast to be seen
              setTimeout(() => {
                console.log('Navigating with sessionId:', sessionId, 'teamId:', teamId);
                
                // Log notification link for debugging
                console.log('Notification link:', notification.link);
                
                // First priority: If we have both team ID and session ID, construct the proper URL
                if (teamId && sessionId) {
                  const url = `/team-member/team/session/${sessionId}`;
                  console.log('Navigating to constructed URL:', url);
                  window.location.href = url;
                }
                // Second priority: If we just have session ID
                else if (sessionId) {
                  const url = `/team-member/session/${sessionId}`;
                  console.log('Navigating to session URL:', url);
                  window.location.href = url;
                }
                // Third priority: Use the notification link if available
                else if (notification.link) {
                  console.log('Navigating to notification link:', notification.link);
                  
                  // Fix for link that points directly to team ID
                  if (notification.link.includes('/teams/')) {
                    const teamIdFromLink = notification.link.split('/teams/')[1];
                    if (teamIdFromLink) {
                      const url = `/team-member/team/sessions`;
                      console.log('Converted team link to proper URL:', url);
                      window.location.href = url;
                    } else {
                      window.location.href = notification.link;
                    }
                  } else {
                    window.location.href = notification.link;
                  }
                }
                // Last resort: Reload the page if we're already on a team page
                else if (window.location.pathname.includes('/team')) {
                  console.log('Reloading current page');
                  window.location.reload();
                }
              }, 800);
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
                  description: "You are already a member of this team."
                });
                
                // Wait a moment before navigation
                setTimeout(() => {
                  console.log('Already in team, notification link:', notification.link);
                  
                  // Fix for link that points directly to team ID
                  if (notification.link && notification.link.includes('/teams/')) {
                    const teamIdFromLink = notification.link.split('/teams/')[1];
                    if (teamIdFromLink) {
                      const url = `/team-member/team/sessions`;
                      console.log('Converted team link to proper URL:', url);
                      window.location.href = url;
                      return;
                    }
                  }
                  
                  // Still navigate to team page as fallback
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }, 800);
              } else {
                // Show error toast for other errors
                toast.error("Error Accepting Invitation", {
                  description: responseText || "An error occurred while accepting the invitation."
                });
              }
            }
          } catch (error: any) {
            console.error('Failed to accept invitation:', error);
            toast.error("Connection Error", {
              description: "Could not connect to the server. Please try again later."
            });
          }
        } else {
          console.error('Invalid or missing invitation ID:', invitationId);
                     // Still try to navigate to the team page if link is available
           if (notificationLink) {
             toast.error("Joining team directly...", {
               description: "Could not process invitation normally, trying alternative method."
             });
            // Navigate after a short delay
            setTimeout(() => {
              console.log('No invitation ID, trying direct navigation with link:', notificationLink);
              
              // Fix for link that points directly to team ID
              if (notificationLink.includes('/teams/')) {
                const teamIdFromLink = notificationLink.split('/teams/')[1];
                if (teamIdFromLink) {
                  const url = `/team-member/team/sessions`;
                  console.log('Converted team link to proper URL:', url);
                  window.location.href = url;
                  return;
                }
              }
              
              window.location.href = notificationLink;
            }, 800);
                     } else {
             toast.error("Error Accepting Invitation", {
               description: "Invitation details not found or invalid. Please try again later."
             });
          }
        }
      } else if (notification.link) {
        // For other notification types, just navigate to the link
        window.location.href = notification.link;
      }
    } catch (error: any) {
      console.error('Failed to process notification action:', error);
      toast.error("Action Failed", {
        description: "Failed to process your request."
      });
    }
    
    // Close notification panel
    setIsOpen(false);
  }, [markAsRead]);

  // Handle decline interaction
  const handleDecline = useCallback(async (notification: Notification) => {
    try {
      // Extract important data first, before any async operations
      const invitationId = notification.type === 'team-invite' ? notification.extraData?.invitationId : null;
      
      // Only try to mark as read, but continue even if it fails
      try {
        await markAsRead(notification);
      } catch (readError) {
        // Log error but continue with the process
        console.error('Failed to mark notification as read:', readError);
        // No need to show error toast for this minor issue
      }
      
      // Handle specific notification types
      if (notification.type === 'team-invite') {
        // Verify we have a valid invitation ID
        if (invitationId && typeof invitationId === 'string' && invitationId.length > 0) {
          try {
            // Use fetch instead of axios to avoid error handling issues
            const token = localStorage.getItem('token');
            
            // Remove any existing toast first
            toast.dismiss();
            
            // Show loading state
            const loadingToastId = toast.loading("Processing invitation...");
            
            const response = await fetch(`http://localhost:2000/votex/api/invitations/${invitationId}/decline`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token || ''
              }
            });
            
            // Dismiss the loading toast
            toast.dismiss(loadingToastId);
            
            if (response.ok) {
              // Show success toast
              toast.success("Team Invitation Declined", {
                description: "You have declined the team invitation."
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
                  description: "This invitation has already been processed."
                });
              } else {
                // Show error toast for other errors
                toast.error("Error Declining Invitation", {
                  description: responseText || "An error occurred while declining the invitation."
                });
              }
            }
          } catch (error: any) {
            console.error('Failed to decline invitation:', error);
            toast.error("Connection Error", {
              description: "Could not connect to the server. Please try again later."
            });
          }
        } else {
          console.error('Invalid or missing invitation ID when declining:', invitationId);
          toast.error("Error Declining Invitation", {
            description: "Invitation details not found or invalid. The invitation may have expired."
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to process notification action:', error);
      toast.error("Action Failed", {
        description: "Failed to process your request."
      });
    }
    
    // Close notification panel
    setIsOpen(false);
  }, [markAsRead]);

  // Handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    // Remove any existing toast first
    toast.dismiss();
    
    // Show loading state
    const loadingToastId = toast.loading("Marking all as read...");
    
    try {
      // First, update local state optimistically to improve UI responsiveness
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (!currentUserId) {
        toast.dismiss(loadingToastId);
        toast.error("User ID not found", {
          description: "Please log in again to continue."
        });
        return;
      }
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => ({
          ...n,
          readBy: n.readBy.includes(currentUserId) ? n.readBy : [...n.readBy, currentUserId]
        }))
      );
      setUnreadCount(0);
      
      // Make the API call to actually mark notifications as read
      const response = await fetch('http://localhost:2000/votex/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || ''
        }
      });
      
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      // Check if the request was successful
      if (response.ok) {
        toast.success("All notifications marked as read");
        
        // Refresh notifications to ensure our state is in sync with the server
        fetchNotifications();
      } else {
        // If the API call failed, revert the optimistic update
        // by refreshing notifications from the server
        toast.error("Failed to mark all as read", {
          description: "Please try again later."
        });
        fetchNotifications();
      }
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
      toast.dismiss(loadingToastId);
      toast.error("Failed to mark all as read", {
        description: error.message || "An unexpected error occurred. Please try again."
      });
      
      // Refresh to ensure state is consistent
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: hasError ? [] : notifications,
        unreadCount: hasError ? 0 : unreadCount,
        isOpen,
        setIsOpen,
        markAsRead: async (notification) => {
          try {
            await markAsRead(notification);
          } catch (e) {
            console.error('Error in markAsRead:', e);
            // Don't set error state for individual marking
          }
        },
        handleNotificationClick: async (notification) => {
          try {
            await handleNotificationClick(notification);
          } catch (e) {
            console.error('Error in handleNotificationClick:', e);
            // Don't set error state for individual clicks
          }
        },
        handleAccept: (notification) => {
          try {
            handleAccept(notification);
          } catch (e) {
            console.error('Error in handleAccept:', e);
            // Don't set error state for individual actions
            toast.error("Failed to process action", {
              description: "Please try again later."
            });
          }
        },
        handleDecline: (notification) => {
          try {
            handleDecline(notification);
          } catch (e) {
            console.error('Error in handleDecline:', e);
            // Don't set error state for individual actions
            toast.error("Failed to process action", {
              description: "Please try again later."
            });
          }
        }
      }}
    >
      {children}
      <NotificationSheet
        notifications={hasError ? [] : notifications}
        onNotificationClick={async (notification) => {
          try {
            await handleNotificationClick(notification);
          } catch (e) {
            console.error('Error in onNotificationClick:', e);
            // Don't set error state for individual clicks
          }
        }}
        open={isOpen}
        setOpen={setIsOpen}
        onAccept={(notification) => {
          try {
            handleAccept(notification);
          } catch (e) {
            console.error('Error in onAccept:', e);
            toast.error("Failed to process action", {
              description: "Please try again later."
            });
          }
        }}
        onDecline={(notification) => {
          try {
            handleDecline(notification);
          } catch (e) {
            console.error('Error in onDecline:', e);
            toast.error("Failed to process action", {
              description: "Please try again later."
            });
          }
        }}
        onMarkAllRead={() => {
          try {
            handleMarkAllAsRead();
          } catch (e) {
            console.error('Error in onMarkAllRead:', e);
            setHasError(true);
            toast.error("Failed to mark all as read", {
              description: "Please try again later."
            });
          }
        }}
        onRefresh={() => {
          try {
            fetchNotifications();
          } catch (e) {
            console.error('Error in onRefresh:', e);
            setHasError(true);
            toast.error("Failed to refresh notifications", {
              description: "Please try again later."
            });
          }
        }}
        triggerClassName="hidden"
      />
    </NotificationContext.Provider>
  );
} 