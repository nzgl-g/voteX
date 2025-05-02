"use client"

import { useState } from "react";
import { SidebarTrigger } from "@/components/shadcn-ui/sidebar";
import { Separator } from "@/components/shadcn-ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/shadcn-ui/breadcrumb";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { Bell } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/shadcn-ui/sheet";

type SiteHeaderProps = {
    title: string;
};

export function SiteHeader({ title }: SiteHeaderProps) {
    const [open, setOpen] = useState(false);

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
                        className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        aria-label="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                    </button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle>Notifications</SheetTitle>
                    </SheetHeader>
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No notifications for you
                    </div>
                </SheetContent>
            </Sheet>

            <div className="ml-2">
                <ThemeToggle />
            </div>
        </header>
    )
}