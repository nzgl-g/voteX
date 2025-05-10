"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationButton } from "@/components/shared/notification-button";

type SiteHeaderProps = {
    title: string;
};

export function SiteHeader({ title }: SiteHeaderProps) {
    // Using a simple string ID for demonstration - replace with your user ID
    const userId = "current-user-id"; 

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

            <NotificationButton />

            <div className="ml-2">
                <ThemeToggle />
            </div>
        </header>
    )
}