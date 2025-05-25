"use client"

import {ReactNode} from "react"
import {ThemeProvider} from "@/components/theme-provider"
import { NotificationProvider } from "@/components/shared/notification-provider"

import {SidebarLeft} from "@/components/sidebar/sidebar-left"
import ChatBubble from "@/components/chat-bubble"
import {SidebarInset, SidebarProvider,} from "@/components/ui/sidebar"

import {
    LifeBuoy,
    CalendarClock,
    LayoutDashboard,
    CheckSquare,
    HelpCircle,
    Settings,
    Users
} from "lucide-react"

const data = {
    // Teams/sessions are now handled dynamically by SessionSelector
    // The teams array is kept empty as they will be loaded by the SessionSelector
    teams: [],
    navMain: [
        /*{title: "Monitoring", url: "/team-leader/monitoring/default", icon: LayoutDashboard },*/
        {title: "Session", url: "/team-leader/session/default", icon: CalendarClock },
        {title: "Team", url: "/team-leader/team/default", icon: Users},
        {title: "Scheduler", url: "/team-leader/scheduler/default", icon: CheckSquare},
        {title: "Support", url: "/team-leader/support", icon: LifeBuoy},
    ],
    navSecondary: [
        {title: "Settings", url: "#", icon: Settings },
        {title: "Help", url: "#", icon: HelpCircle},
    ]
}

export default function Layout({children}: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <NotificationProvider>
                <SidebarProvider style={{
                    // Using string type assertion to avoid TypeScript errors with custom CSS properties
                    "--sidebar-width": "16rem",
                    "--sidebar-width-mobile": "15rem",
                } as React.CSSProperties}>
                    <SidebarLeft variant={"inset"}
                        sessions={data.teams}
                        navMain={data.navMain}
                        navSecondary={data.navSecondary}
                        userRole="team-leader"
                    />
                    <SidebarInset>
                        {children}
                    </SidebarInset>
                </SidebarProvider>
                <ChatBubble/>
            </NotificationProvider>
        </ThemeProvider>
    )
}
