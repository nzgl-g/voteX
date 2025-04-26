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

import {
    IconCalendarCog,
    IconDashboard,
    IconChecklist,
    IconHelp,
    IconSteam,
    IconSettings,
    IconLifebuoyFilled,
} from "@tabler/icons-react"

const data = {
    teams: [
        {name: "Presidential Election", logo: Landmark, plan: "Enterprise"},
        {name: "Local Election", logo: Building2, plan: "Startup"},
        {name: "CEO Election", logo: BriefcaseBusiness, plan: "Free"},
    ],
    navMain: [
        {title: "Monitoring", url: "./monitoring", icon: IconDashboard },
        {title: "Session", url: "./session", icon: IconCalendarCog ,},
        {title: "Team", url: "./team", icon: IconSteam},
        {title: "Scheduler", url: "./scheduler", icon: IconChecklist},
        {title: "Support", url: "./support", icon: IconLifebuoyFilled},
    ],
    navSecondary: [
        {title: "Settings", url: "#", icon: IconSettings },
        {title: "Help", url: "#", icon: IconHelp},
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
