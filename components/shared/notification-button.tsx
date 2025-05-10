'use client';

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotificationContext } from "./notification-provider";
import { Button } from "@/components/ui/button";

export function NotificationButton() {
  const { unreadCount, setIsOpen } = useNotificationContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setIsOpen(true)}
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
    </Button>
  );
} 