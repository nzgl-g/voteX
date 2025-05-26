'use client';

import { Bell } from "lucide-react";
import { useNotificationContext } from "./notification-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationButton() {
  const { setIsOpen, unreadCount } = useNotificationContext();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full bg-background hover:bg-accent hover:text-accent-foreground transition-colors relative",
        unreadCount > 0 && "border-primary"
      )}
      onClick={() => setIsOpen(true)}
      aria-label="Notifications"
    >
      <Bell 
        className={cn(
          "h-[1.2rem] w-[1.2rem]",
          unreadCount > 0 && "text-primary animate-pulse"
        )} 
      />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
} 