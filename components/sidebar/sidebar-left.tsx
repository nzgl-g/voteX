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
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

interface NavItem {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badge?: React.ReactNode
}

interface Team {
    name: string
    plan: string
}

interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
    teams: Team[]
    navMain: NavItem[]
    navSecondary: NavItem[]
}

export function SidebarLeft({
                                teams,
                                navMain,
                                navSecondary,
                                ...props
                            }: SidebarLeftProps) {
    const pathname = usePathname()

    const getActiveItems = (items: NavItem[]): NavItem[] =>
        items.map(item => ({
            ...item,
            isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
        }))

    return (
        <Sidebar className="border-r-0" {...props}>
            <SidebarHeader />
            <SidebarContent>
                <div className="ml-2 mt-1">
                    <TeamSwitcher teams={teams} />
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
