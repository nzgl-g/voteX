"use client"

import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
} from "@/components/shadcn-ui/sidebar"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { SessionSelector } from "@/components/sidebar/session-selector"
import { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

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
        <Sidebar className="border-r-0" {...props}>
            <SidebarHeader />
            <SidebarContent>
                <div className="ml-2 mt-1">
                    <SessionSelector />
                </div>
                <div className="mt-6 ml-2">
                    <NavMain items={getActiveItems(navMain)} />
                </div>
                <NavSecondary items={getActiveItems(navSecondary)} className="mt-auto" />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
