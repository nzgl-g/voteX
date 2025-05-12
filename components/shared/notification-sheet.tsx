'use client';

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Notification } from "@/services/notification-service";

// Extended notification type with UI-specific properties
type NotificationWithUI = Notification & {
  category?: 'Interaction' | 'Information';
  timestamp?: string;
  id?: string; // For backward compatibility with UI
};

interface NotificationSheetProps {
  notifications: NotificationWithUI[];
  onNotificationClick: (notification: NotificationWithUI) => void;
  unreadCount: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerClassName?: string;
  contentClassName?: string;
  onAccept?: (notification: NotificationWithUI) => void;
  onDecline?: (notification: NotificationWithUI) => void;
}

export function NotificationSheet({
  notifications,
  onNotificationClick,
  unreadCount,
  open,
  setOpen,
  onAccept,
  onDecline,
  triggerClassName = "relative flex items-center justify-center h-9 w-9 rounded-full border border-input bg-muted hover:bg-accent hover:text-accent-foreground transition-colors",
  contentClassName = "w-[360px]",
}: NotificationSheetProps) {
  const showTrigger = triggerClassName !== "hidden";
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
          <button
            className={triggerClassName}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
        </SheetTrigger>
      )}

      <SheetContent side="right" className={contentClassName}>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        {notifications.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
            {notifications.map((notification) => (
              <div
                key={notification._id || notification.id || Math.random().toString()}
                className={`rounded-lg border p-3 shadow-sm transition-colors ${
                  notification.read ? "bg-background" : "bg-muted"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <Badge
                    variant={
                      notification.category === "Interaction"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {notification.type.replace(/-/g, " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp || notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-2">{notification.message}</p>
                
                {notification.category === "Interaction" && onAccept && onDecline ? (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccept(notification);
                      }}
                      size="sm"
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecline(notification);
                      }}
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onNotificationClick(notification)}
                  >
                    View details
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
            No notifications for you
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}  