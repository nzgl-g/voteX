"use client"

import {ReactNode} from "react"
import {ThemeProvider} from "@/components/theme-provider"
import {Toaster} from "@/components/shadcn-ui/sonner"

import {SidebarLeft} from "@/components/sidebar/sidebar-left"
import ChatBubble from "@/components/chat-bubble"
import {SidebarInset, SidebarProvider,} from "@/components/shadcn-ui/sidebar"

import {
    BarChart3,
    BriefcaseBusiness,
    Building2,
    CheckCircle,
    ClipboardList,
    Landmark,
    LifeBuoy,
    MessageCircleQuestion,
    Settings2,
    Users2,
} from "lucide-react"

const data = {
    teams: [
        {name: "Presidential Election", logo: Landmark, plan: "Enterprise"},
        {name: "Local Election", logo: Building2, plan: "Startup"},
        {name: "CEO Election", logo: BriefcaseBusiness, plan: "Free"},
    ],
    navMain: [
        {title: "Real Time Analytics", url: "./real-time-analytics", icon: BarChart3 },
        {title: "Session Management", url: "./session-management", icon: ClipboardList ,},
        {title: "Team Management", url: "./team-management", icon: Users2},
        {title: "Task Assignment", url: "./task-assignment", icon: CheckCircle},
        {title: "Support", url: "./support", icon: LifeBuoy},
    ],
    navSecondary: [
        {title: "Settings", url: "#", icon: Settings2},
        {title: "Help", url: "#", icon: MessageCircleQuestion},
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
                    teams={data.teams}
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
