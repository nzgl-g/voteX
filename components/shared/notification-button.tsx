'use client';

import { Bell } from "lucide-react";
import { useNotificationContext } from "./notification-provider";
import { Button } from "@/components/ui/button";

export function NotificationButton() {
  const { setIsOpen } = useNotificationContext();

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-background hover:bg-accent hover:text-accent-foreground transition-colors relative"
      onClick={() => setIsOpen(true)}
      aria-label="Notifications"
    >
      <Bell className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
} 