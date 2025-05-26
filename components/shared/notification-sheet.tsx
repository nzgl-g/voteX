'use client';

import React from 'react';
import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, ArrowRight } from "lucide-react";
import { Notification } from "@/services/notification-service";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface NotificationSheetProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerClassName?: string;
  contentClassName?: string;
  onAccept?: (notification: Notification) => void;
  onDecline?: (notification: Notification) => void;
}

export function NotificationSheet({
  notifications,
  onNotificationClick,
  open,
  setOpen,
  onAccept,
  onDecline,
  triggerClassName = "relative flex items-center justify-center h-9 w-9 rounded-full border border-input bg-muted hover:bg-accent hover:text-accent-foreground transition-colors",
  contentClassName = "w-[360px] px-1",
}: NotificationSheetProps) {
  const showTrigger = triggerClassName !== "hidden";
  
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
  
  // Get notification category color
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'interaction':
        return 'bg-blue-500/10 text-blue-500';
      case 'alert':
        return 'bg-red-500/10 text-red-500';
      case 'update':
        return 'bg-green-500/10 text-green-500';
      case 'info':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
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
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
          <button
            className={triggerClassName}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </SheetTrigger>
      )}

      <SheetContent side="right" className={contentClassName}>
        <SheetHeader className="sticky top-0 z-10 pt-0 pb-3 mb-2 border-b bg-background">
          <SheetTitle className="text-xl font-semibold">Notifications</SheetTitle>
        </SheetHeader>
        
        <div className="mt-3">
          {notifications.length > 0 ? (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1 pl-1">
              {notifications.map((notification) => {
                const actionLabels = getActionLabels(notification);
                const isNotificationRead = isRead(notification);
                
                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "rounded-lg border p-4 shadow-sm transition-all relative",
                      isNotificationRead 
                        ? 'bg-background opacity-75 hover:opacity-100' 
                        : 'bg-accent/5 border-accent/30'
                    )}
                    onClick={() => !isInteraction(notification) && onNotificationClick(notification)}
                  >
                    {!isNotificationRead && (
                      <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-[10px] py-0 h-5", getCategoryColor(notification.category))}>
                        {notification.category}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                    </div>
                    
                    <p className={cn(
                      "text-sm font-medium mb-3",
                      isNotificationRead ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {notification.message}
                    </p>
                    
                    {isInteraction(notification) ? (
                      <div className="flex justify-end gap-2 mt-3">
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
                            {actionLabels.accept}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 text-xs h-8 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNotificationClick(notification);
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRight className="ml-1 h-3 w-0 transition-all opacity-0 group-hover:w-3 group-hover:opacity-100" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground opacity-40" />
              </div>
              <p className="text-muted-foreground font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                You'll see notifications here when there's activity
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}  