"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { ChevronDown, Plus, Vote, BarChart, Trophy, Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import apiClient from "@/lib/api"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/shadcn-ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shadcn-ui/sidebar"

// Define session type for the team switcher
interface SessionItem {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  plan: string
}

export function TeamSwitcher() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to get the appropriate icon based on session type
  const getSessionIcon = (type: string) => {
    switch (type) {
      case "poll":
        return Vote
      case "election":
        return BarChart
      case "tournament":
        return Trophy
      default:
        return Vote
    }
  }

  // Fetch user's sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get("/sessions/my-sessions")
        const sessionData = response.data.map((session: any) => ({
          id: session._id,
          name: session.name,
          type: session.type,
          plan: session.subscription?.name || "free"
        }))
        
        setSessions(sessionData)
        
        // Extract session ID from URL for any team leader section
        const pathParts = pathname.split('/')
        const sectionIndex = pathParts.findIndex(part => 
          ['session', 'monitoring', 'team', 'scheduler'].includes(part)
        )
        
        let sessionIdFromUrl = null
        if (sectionIndex !== -1 && pathParts.length > sectionIndex + 1) {
          sessionIdFromUrl = pathParts[sectionIndex + 1]
          // If it's 'default', don't use it as a real session ID
          if (sessionIdFromUrl === 'default') {
            sessionIdFromUrl = null
          }
        }
        
        if (sessionIdFromUrl && sessionData.some((s: SessionItem) => s.id === sessionIdFromUrl)) {
          setActiveSession(sessionData.find((s: SessionItem) => s.id === sessionIdFromUrl) || null)
        } else if (sessionData.length > 0) {
          setActiveSession(sessionData[0])
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [pathname])

  // Handle session selection
  const handleSessionSelect = (session: SessionItem) => {
    setActiveSession(session)
    
    // Get the current section from the URL
    const pathParts = pathname.split('/')
    const currentSection = pathParts.find(part => 
      ['session', 'monitoring', 'team', 'scheduler'].includes(part)
    ) || 'session'
    
    // Navigate to the same section but with the new session ID
    router.push(`/team-leader/${currentSection}/${session.id}`)
  }

  // Handle creating a new session
  const handleCreateSession = () => {
    router.push("/subscription")
  }

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="w-fit px-1.5">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
              <Loader2 className="size-3 animate-spin" />
            </div>
            <span className="truncate font-medium">Loading sessions...</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeSession && sessions.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            className="w-fit px-1.5"
            onClick={handleCreateSession}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
              <Plus className="size-3" />
            </div>
            <span className="truncate font-medium">Create your first session</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              {activeSession && (
                <>
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                    {React.createElement(getSessionIcon(activeSession.type), { className: "size-3" })}
                  </div>
                  <span className="truncate font-medium">{activeSession.name}</span>
                  <ChevronDown className="opacity-50" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Sessions
            </DropdownMenuLabel>
            {sessions.map((session, index) => {
              const SessionIcon = getSessionIcon(session.type)
              return (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => handleSessionSelect(session)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <SessionIcon className="size-4 shrink-0" />
                  </div>
                  <div className="flex-1 truncate">{session.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{session.plan}</div>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={handleCreateSession}>
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Create New Session</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
