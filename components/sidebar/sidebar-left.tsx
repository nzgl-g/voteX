"use client"

import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
    SidebarTrigger,
    SidebarSeparator,
} from "@/components/ui/sidebar"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { SessionSelector } from "@/components/sidebar/session-selector"
import { UserProfile } from "@/components/shared/user-profile"
import { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"
import { Vote } from "lucide-react"
import Image from "next/image"

interface NavItem {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badge?: React.ReactNode
}

interface Session {
    name: string
    plan: string
}

interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
    sessions: Session[]
    navMain: NavItem[]
    navSecondary: NavItem[]
}

export function SidebarLeft({
                                sessions,
                                navMain,
                                navSecondary,
                                ...props
                            }: SidebarLeftProps) {
    const pathname = usePathname()
    const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({ 
        name: "User", 
        email: "" 
    });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const userProfile = await authApi.fetchUserProfile();
                setUserData({
                    name: userProfile.name || "User",
                    email: userProfile.email || "",
                    avatar: userProfile.avatar || undefined
                });
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);
    
    // Extract session ID from the current path if it exists
    const getSessionIdFromPath = () => {
        const pathSegments = pathname.split('/')
        // Assuming session IDs are MongoDB ObjectIds (24 character hex strings)
        const sessionIdPattern = /^[0-9a-f]{24}$/i
        return pathSegments.find(segment => sessionIdPattern.test(segment))
    }

    const getActiveItems = (items: NavItem[]): NavItem[] => {
        const sessionId = getSessionIdFromPath()
        
        return items.map(item => {
            // Check if the base path matches (without considering session ID)
            const basePathMatch = pathname.startsWith(item.url) || 
                                 (sessionId && pathname.includes(sessionId) && 
                                  item.url.split('/').slice(0, -1).join('/') === pathname.split('/').slice(0, -1).join('/'))
            
            return {
                ...item,
                isActive: !!basePathMatch, // Convert to boolean to fix type error
            }
        })
    }

    return (
        <Sidebar className="border-r shadow-sm" {...props}>
            <SidebarHeader className="py-3 px-2">
                <div className="flex items-center justify-center w-full">
                    <div className="flex items-center">
                        <div className="h-8 w-auto mr-2">
                            <Image 
                                src="/logos/logo-expanded.svg" 
                                alt="VoteX Logo" 
                                width={120}
                                height={32}
                                className="h-8 w-auto hidden dark:block" 
                            />
                            <Image 
                                src="/logos/logo-expanded-dark.svg" 
                                alt="VoteX Logo" 
                                width={120}
                                height={32}
                                className="h-8 w-auto block dark:hidden" 
                            />
                        </div>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="pt-2">
                <div className="px-2 mb-4">
                    <SessionSelector />
                </div>
                <SidebarSeparator className="mb-2" />
                <div className="px-2 mb-1">
                    <NavMain items={getActiveItems(navMain)} />
                </div>
                <NavSecondary items={getActiveItems(navSecondary)} className="mt-auto" />
                <div className="mt-4 px-2 pb-4">
                    <UserProfile 
                        userName={userData.name}
                        userEmail={userData.email}
                        userAvatar={userData.avatar}
                        variant="sidebar"
                    />
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
