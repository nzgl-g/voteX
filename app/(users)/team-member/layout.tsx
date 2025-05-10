"use client"

import {ReactNode} from "react"
import {ThemeProvider} from "@/components/theme-provider"
import {Toaster} from "@/components/ui/sonner"
import { NotificationProvider } from "@/components/shared/notification-provider"

import {SidebarLeft} from "@/components/sidebar/sidebar-left"
import ChatBubble from "@/components/chat-bubble"
import {SidebarInset, SidebarProvider,} from "@/components/ui/sidebar"

import {
    BriefcaseBusiness,
    Building2,
    Landmark,
    LifeBuoy,
    CalendarClock,
    LayoutDashboard,
    CheckSquare,
    HelpCircle,
    Settings,
} from "lucide-react"

const data = {
    teams: [
        {name: "Presidential Election", logo: Landmark, plan: "Member"},
        {name: "Local Election", logo: Building2, plan: "Member"},
        {name: "CEO Election", logo: BriefcaseBusiness, plan: "Member"},
    ],
    navMain: [
        {title: "Monitoring", url: "/team-member/monitoring/default", icon: LayoutDashboard },
        {title: "Session", url: "/team-member/session/default", icon: CalendarClock },
        {title: "Scheduler", url: "/team-member/tasks/default", icon: CheckSquare},
        {title: "Scheduler", url: "/team-member/scheduler/default", icon: CheckSquare},
        {title: "Scheduler", url: "/team-member/support/default", icon: CheckSquare},
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
                    />
                    <SidebarInset>
                        {children}
                    </SidebarInset>
                </SidebarProvider>
                <ChatBubble/>
                <Toaster position="bottom-center"/>
            </NotificationProvider>
        </ThemeProvider>
    )
} 