"use client"

import { useState, useEffect } from "react"
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
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
    title: string;
};

export function SiteHeader({ title }: SiteHeaderProps) {
    const [scrolled, setScrolled] = useState(false);
    
    // Add scroll event listener to detect when page is scrolled
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header 
            className={cn(
                "bg-background/80 backdrop-blur-sm sticky top-0 z-50 flex h-16 items-center gap-3 px-4 border-b transition-all duration-200 ease-in-out",
                scrolled && "shadow-md h-14 border-b-primary/10"
            )}
        >
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-5"
            />
            <Breadcrumb className="flex-1">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 font-semibold text-lg">
                            {title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-2">
                <NotificationButton />
                <ThemeToggle />
            </div>
        </header>
    )
}