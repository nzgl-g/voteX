"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationPayload } from "@/hooks/use-notification";

interface VoterHeaderProps {
  notifications: NotificationPayload[];
  onNotificationClick: (notification: NotificationPayload) => void;
  unreadCount: number;
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
}

export function VoterHeader({
  notifications,
  onNotificationClick,
  unreadCount,
  notificationOpen,
  setNotificationOpen,
}: VoterHeaderProps) {
  const { theme } = useTheme();

  const getLogo = () => {
    if (theme === 'dark') {
      return "/logo/expanded-dark.png";
    }
    return "/logo/expanded.png";
  };

  return (
    <header className="bg-background sticky top-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm max-w-screen-2xl mx-auto w-full">
      <div className="flex items-center">
        <div className="relative h-8 w-auto">
          <Image 
            src={getLogo()} 
            alt="Vote System Logo" 
            width={120} 
            height={32} 
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notification Button */}
        <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
          <SheetTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            {notifications.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-100px)]">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-md border ${notification.read ? 'bg-background' : 'bg-muted'}`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant={notification.type === 'error' ? 'destructive' : notification.type === 'success' ? 'default' : 'secondary'}>
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{notification.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No notifications for you
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* User Profile */}
        <UserProfile />
      </div>
    </header>
  );
} 