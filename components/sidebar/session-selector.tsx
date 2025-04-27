"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { ChevronDown, Plus, Vote, BarChart, Trophy, Loader2, AlertCircle } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn-ui/dialog"
import { Button } from "@/components/shadcn-ui/button"

// Define session type for the team switcher
interface SessionItem {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  plan: string
}

// No Sessions Dialog Component
function NoSessionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()

  const handleCreateSession = () => {
    router.push('/subscription')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            No Sessions Available
          </DialogTitle>
          <DialogDescription>
            You don't have any active sessions. Create a new session to get started.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleCreateSession} className="w-full">
            Create New Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SessionSelector() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNoSessionsDialog, setShowNoSessionsDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Function to fetch user sessions from the server
  const fetchSessions = async () => {
    try {
      setLoading(true)
      
      try {
        // Use the API client which already handles authentication
        const response = await apiClient.get('/sessions/my-sessions')
        
        console.log('Fetched sessions:', response.data)
        
        // Transform the response data to match the SessionItem interface
        const sessionItems: SessionItem[] = response.data.map((session: any) => ({
          id: session._id,
          name: session.name,
          type: session.type as "poll" | "election" | "tournament",
          plan: session.subscription?.name || "free"
        }))
        
        setSessions(sessionItems)
        
        // If no sessions found, show the dialog
        if (sessionItems.length === 0) {
          setShowNoSessionsDialog(true)
        } else {
          setShowNoSessionsDialog(false)
          
          // Find the current session from the pathname
          const currentSessionId = getSessionIdFromPath()
          
          // Set the active session based on the current URL
          if (currentSessionId) {
            const currentSession = sessionItems.find(session => session.id === currentSessionId)
            if (currentSession) {
              setActiveSession(currentSession)
            } else if (sessionItems.length > 0) {
              // If current session not found in the list, set the first one as active
              setActiveSession(sessionItems[0])
            }
          } else if (sessionItems.length > 0) {
            // If no session ID in the URL, set the first one as active
            setActiveSession(sessionItems[0])
          }
        }
      } catch (error: any) {
        console.error('Error fetching sessions:', error)
        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data)
        }
        setShowNoSessionsDialog(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch sessions when the component mounts and when the pathname changes
  useEffect(() => {
    fetchSessions()
  }, [pathname])

  // Get the session ID from the current path
  const getSessionIdFromPath = () => {
    const pathSegments = pathname.split('/')
    return pathSegments.find(segment => sessions.some(session => session.id === segment))
  }

  // Handle session selection
  const handleSessionSelect = (session: SessionItem) => {
    setActiveSession(session)
    
    // Extract the path segments
    const pathSegments = pathname.split('/')
    
    // Determine if we're in team-leader or team-member route
    const isTeamLeader = pathname.includes('team-leader')
    const isTeamMember = pathname.includes('team-member')
    
    if (isTeamLeader || isTeamMember) {
      // Get the role segment (team-leader or team-member)
      const roleSegment = isTeamLeader ? 'team-leader' : 'team-member'
      
      // Get the section segment (monitoring, team, scheduler, etc.)
      // Default to monitoring if not found
      let sectionSegment = 'monitoring'
      if (pathSegments.length > 2) {
        // Check if the third segment is a valid section (not a session ID)
        const thirdSegment = pathSegments[2]
        if (thirdSegment && !thirdSegment.match(/^[0-9a-fA-F]{24}$/)) {
          sectionSegment = thirdSegment
        }
      }
      
      // Navigate to the selected session with the correct path structure
      router.push(`/${roleSegment}/${sectionSegment}/${session.id}`)
    } else {
      // For other routes, just use the session ID
      router.push(`/team-leader/monitoring/${session.id}`)
    }
  }

  // Handle creating a new session
  const handleCreateSession = () => {
    router.push('/pricing')
  }

  // Get the appropriate icon based on session type
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

  if (loading) {
    return (
      <>
        <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
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
      </>
    )
  }

  if (!activeSession && sessions.length === 0) {
    return (
      <>
        <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
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
      </>
    )
  }

  return (
    <>
      <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
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
    </>
  )
}
