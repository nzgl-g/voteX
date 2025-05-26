'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, ArrowRight, Info, AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Notification } from "@/services/notification-service";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationSheetProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerClassName?: string;
  contentClassName?: string;
  onAccept?: (notification: Notification) => void;
  onDecline?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  onRefresh?: () => void;
}

export function NotificationSheet({
  notifications,
  onNotificationClick,
  open,
  setOpen,
  onAccept,
  onDecline,
  onMarkAllRead,
  onRefresh,
  triggerClassName = "relative flex items-center justify-center h-10 w-10 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
  contentClassName = "sm:w-[400px] px-0",
}: NotificationSheetProps) {
  const showTrigger = triggerClassName !== "hidden";
  const [activeTab, setActiveTab] = useState<string>("all");
  const [animateNotifications, setAnimateNotifications] = useState<boolean>(false);

  // Get current user ID
  const getCurrentUserId = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user._id || null;
    } catch (e) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Check if notification is read by current user
  const isRead = (notification: Notification): boolean => {
    if (!currentUserId) return false;
    return Array.isArray(notification.readBy) && notification.readBy.includes(currentUserId);
  };

  // Check if notification is an interaction type
  const isInteraction = (notification: Notification): boolean => {
    return notification.category === 'Interaction';
  };

  // Format date as "X time ago" (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get notification category color and icon
  const getCategoryInfo = (category: string): { color: string; icon: React.ReactNode } => {
    switch (category.toLowerCase()) {
      case 'interaction':
        return { 
          color: 'bg-blue-500/10 text-blue-500 border-blue-200', 
          icon: <MessageSquare className="h-3.5 w-3.5" />
        };
      case 'alert':
        return { 
          color: 'bg-red-500/10 text-red-500 border-red-200', 
          icon: <AlertTriangle className="h-3.5 w-3.5" />
        };
      case 'update':
        return { 
          color: 'bg-green-500/10 text-green-500 border-green-200', 
          icon: <RefreshCw className="h-3.5 w-3.5" />
        };
      case 'info':
        return { 
          color: 'bg-purple-500/10 text-purple-500 border-purple-200', 
          icon: <Info className="h-3.5 w-3.5" />
        };
      default:
        return { 
          color: 'bg-gray-500/10 text-gray-500 border-gray-200', 
          icon: <Info className="h-3.5 w-3.5" />
        };
    }
  };

  // Get notification action labels based on type
  const getActionLabels = (notification: Notification): { accept: string; decline: string } => {
    switch (notification.type) {
      case 'team-invite':
        return { accept: 'Join', decline: 'Decline' };
      case 'candidate-invite':
        return { accept: 'Accept', decline: 'Decline' };
      case 'session-edit-request':
        return { accept: 'Approve', decline: 'Reject' };
      case 'task-assigned':
        return { accept: 'Accept', decline: 'Decline' };
      default:
        return { accept: 'Accept', decline: 'Decline' };
    }
  };

  // Effect to animate notifications when they appear
  useEffect(() => {
    if (open) {
      // Small delay to ensure animations run after sheet is open
      const timer = setTimeout(() => {
        setAnimateNotifications(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimateNotifications(false);
    }
  }, [open]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !isRead(notification);
    if (activeTab === 'interaction') return notification.category.toLowerCase() === 'interaction';
    return true;
  });

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !isRead(notification)).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(triggerClassName, "relative")}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SheetTrigger>
      )}

      <SheetContent side="right" className={cn(contentClassName, "flex flex-col")}>
        <SheetHeader className="sticky top-0 z-10 pt-1 pb-3 border-b bg-background">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-semibold">Notifications</SheetTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Refresh notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onMarkAllRead && unreadCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMarkAllRead}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Mark all as read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-3 mb-4 w-full">
            <TabsTrigger value="all" className="text-xs">
              All
              {notifications.length > 0 && (
                <span className="ml-1 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                  {notifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="interaction" className="text-xs">
              Actions
              {notifications.filter(n => isInteraction(n)).length > 0 && (
                <span className="ml-1 text-[10px] bg-blue-500/10 text-blue-500 rounded-full px-1.5 py-0.5">
                  {notifications.filter(n => isInteraction(n)).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 outline-none">
            <ScrollArea className="flex-1 pr-3 -mr-3 max-h-[calc(100vh-180px)]">
              {filteredNotifications.length > 0 ? (
                <div className="flex flex-col gap-3 px-1">
                  <AnimatePresence>
                    {filteredNotifications.map((notification, index) => {
                      const actionLabels = getActionLabels(notification);
                      const isNotificationRead = isRead(notification);
                      const categoryInfo = getCategoryInfo(notification.category);
                      
                      return (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={animateNotifications ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                                                      className={cn(
                            "rounded-lg border p-4 shadow-sm relative",
                            isNotificationRead 
                              ? 'bg-background' 
                              : 'bg-accent/5 border-accent/30',
                            'cursor-default' // All notifications are not clickable
                          )}
                          // Only interaction notifications can be clicked, and even then only if they have actions
                          onClick={() => false /* Disable all click behavior */}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                              categoryInfo.color
                            )}>
                              {categoryInfo.icon}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <Badge variant="outline" className={cn("text-[10px] py-0 h-5 font-medium", categoryInfo.color)}>
                                  {notification.category}
                                </Badge>
                                
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatRelativeTime(notification.createdAt)}</span>
                                </div>
                              </div>
                              
                              <p className={cn(
                                "text-sm mb-3 leading-relaxed",
                                isNotificationRead ? 'text-muted-foreground' : 'text-foreground font-medium'
                              )}>
                                {notification.message}
                              </p>
                              
                              {/* Interaction notifications (like team invites) have action buttons */}
                              {isInteraction(notification) ? (
                                <div className="flex justify-end gap-2 mt-4">
                                  {/* Only show actions if this is a team invite and has not been processed yet */}
                                  {notification.type === 'team-invite' && notification.extraData?.status === 'pending' ? (
                                    <>
                                      {onDecline && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-full text-xs px-4 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDecline(notification);
                                          }}
                                        >
                                          <X className="h-3.5 w-3.5 mr-1.5" />
                                          {actionLabels.decline}
                                        </Button>
                                      )}
                                      {onAccept && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="h-8 rounded-full text-xs px-4"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onAccept(notification);
                                          }}
                                        >
                                          <Check className="h-3.5 w-3.5 mr-1.5" />
                                          {actionLabels.accept}
                                        </Button>
                                      )}
                                    </>
                                  ) : notification.type === 'team-invite' && notification.extraData?.status === 'accepted' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-full text-xs px-4 text-green-600"
                                      disabled
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1.5" />
                                      Already Joined
                                    </Button>
                                  ) : notification.type === 'team-invite' && notification.extraData?.status === 'rejected' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-full text-xs px-4 text-muted-foreground"
                                      disabled
                                    >
                                      <X className="h-3.5 w-3.5 mr-1.5" />
                                      Declined
                                    </Button>
                                  ) : (
                                    <>
                                      {onDecline && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-full text-xs px-4 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDecline(notification);
                                          }}
                                        >
                                          <X className="h-3.5 w-3.5 mr-1.5" />
                                          {actionLabels.decline}
                                        </Button>
                                      )}
                                      {onAccept && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="h-8 rounded-full text-xs px-4"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onAccept(notification);
                                          }}
                                        >
                                          <Check className="h-3.5 w-3.5 mr-1.5" />
                                          {actionLabels.accept}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : null /* Alert notifications don't have any buttons - purely informational */}
                              
                              {!isNotificationRead && (
                                <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-5 mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-muted-foreground font-medium text-center">
                    {activeTab === 'all' ? 'No notifications yet' :
                     activeTab === 'unread' ? 'No unread notifications' :
                     'No action notifications'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-center max-w-[250px]">
                    {activeTab === 'all' ? 'You\'ll see notifications here when there\'s activity' :
                     activeTab === 'unread' ? 'All caught up! Check back later for new notifications' :
                     'No pending actions require your attention right now'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="mt-auto pt-3 border-t">
          <SheetClose asChild>
            <Button variant="outline" size="sm" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}