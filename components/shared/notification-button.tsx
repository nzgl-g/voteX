'use client';

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotificationContext } from "./notification-provider";
import { Button } from "@/components/ui/button";

export function NotificationButton() {
  const { unreadCount, setIsOpen } = useNotificationContext();

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-background hover:bg-accent hover:text-accent-foreground transition-colors relative"
      onClick={() => setIsOpen(true)}
      aria-label="Notifications"
    >
      <Bell className="h-[1.2rem] w-[1.2rem]" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
} 