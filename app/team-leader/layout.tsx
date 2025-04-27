"use client"

import {ReactNode} from "react"
import {ThemeProvider} from "@/components/theme-provider"
import {Toaster} from "@/components/shadcn-ui/sonner"

import {SidebarLeft} from "@/components/sidebar/sidebar-left"
import ChatBubble from "@/components/chat-bubble"
import {SidebarInset, SidebarProvider,} from "@/components/shadcn-ui/sidebar"

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
    Users
} from "lucide-react"

const data = {
    teams: [
        {name: "Presidential Election", logo: Landmark, plan: "Enterprise"},
        {name: "Local Election", logo: Building2, plan: "Startup"},
        {name: "CEO Election", logo: BriefcaseBusiness, plan: "Free"},
    ],
    navMain: [
        {title: "Monitoring", url: "/team-leader/monitoring/default", icon: LayoutDashboard },
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
        </ThemeProvider>
    )
}
