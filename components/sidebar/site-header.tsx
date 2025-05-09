"use client"

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import useNotification, { NotificationPayload } from "@/hooks/use-notification";
import { Badge } from "@/components/ui/badge";

type SiteHeaderProps = {
    title: string;
};

export function SiteHeader({ title }: SiteHeaderProps) {
    const [open, setOpen] = useState(false);
    // Using a simple string ID for demonstration - replace with your user ID
    const userId = "current-user-id"; 
    const { notifications, markAsRead } = useNotification(userId);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: NotificationPayload) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    return (
        <header className="bg-background sticky top-0 z-50 flex h-14 items-center gap-2 px-3 rounded-t-md shadow-sm">
            <SidebarTrigger />
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="flex-1">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 font-medium">
                            {title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Sheet open={open} onOpenChange={setOpen}>
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
                                    onClick={() => handleNotificationClick(notification)}
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

            <div className="ml-2">
                <ThemeToggle />
            </div>
        </header>
    )
}