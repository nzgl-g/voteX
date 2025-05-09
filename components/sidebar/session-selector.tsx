"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { ChevronDown, Plus, Vote, BarChart, Trophy, Loader2, AlertCircle, User, Users, Home } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import apiClient from "@/lib/api"
import { PricingDialog } from "@/components/pricing-dialog"
import { teamService, Team } from "@/api/team-service"
import { sessionService } from "@/api/session-service"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Define session type for the team switcher
interface SessionItem {
  id: string;
  name: string;
  type: "poll" | "election" | "tournament";
  plan: string;
  role?: "leader" | "member";
}

// No Sessions Dialog Component
function NoSessionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  const handleCreateSession = () => {
    setIsPricingOpen(true)
    onOpenChange(false)
  }

  const handlePlanSelected = (plan: "free" | "pro" | "enterprise") => {
    setIsPricingOpen(false)
    router.push(`/session-setup?plan=${plan}`)
  }

  return (
    <>
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

      <PricingDialog 
        open={isPricingOpen} 
        onOpenChange={setIsPricingOpen} 
        onPlanSelected={handlePlanSelected} 
      />
    </>
  )
}

export function SessionSelector() {
  const [mySessions, setMySessions] = useState<SessionItem[]>([])
  const [memberSessions, setMemberSessions] = useState<SessionItem[]>([])
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNoSessionsDialog, setShowNoSessionsDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  // Function to fetch user sessions from the server
  const fetchSessions = async () => {
    try {
      setLoading(true)
      
      try {
        // Get all teams the user is part of (as leader or member)
        const teams = await teamService.getUserTeams();
        
        // Create arrays to separate sessions by role
        const leaderSessions: SessionItem[] = [];
        const memberSessions: SessionItem[] = [];
        
        // Process teams to determine which are led by the user vs which they're just a member of
        for (const team of teams) {
          // Get the user's ID from localStorage
          const userStr = localStorage.getItem('user');
          
          if (!userStr) continue;
          
          const user = JSON.parse(userStr);
          const userId = user._id;
          
          // Check if this team belongs to a session
          if (team.session) {
            // Fetch basic session info
            try {
              // Handle the type for session ID safely
              const sessionId = typeof team.session === 'string' 
                ? team.session 
                : (team.session as any)._id || '';
              
              const sessionInfo = await sessionService.getSessionById(
                sessionId,
                'name,type,subscription'
              );
              
              // Determine if user is leader or member
              const isLeader = typeof team.leader === 'object' 
                ? team.leader._id === userId 
                : team.leader === userId;
              
              const sessionItem: SessionItem = {
                id: sessionId,
                name: team.sessionName || (sessionInfo as any).name || 'Unnamed Session',
                type: ((sessionInfo as any).type as "poll" | "election" | "tournament") || 'poll',
                plan: (sessionInfo as any).subscription?.name || 'free',
                role: isLeader ? 'leader' : 'member'
              };
              
              if (isLeader) {
                leaderSessions.push(sessionItem);
              } else {
                memberSessions.push(sessionItem);
              }
            } catch (error) {
              // Use optional chaining and type assertion for team._id
              console.error(`Failed to fetch session info for team ${(team as any)._id || 'unknown'}:`, error);
            }
          }
        }
        
        // Set the processed sessions
        setMySessions(leaderSessions);
        setMemberSessions(memberSessions);
        
        // Combine all sessions for active session detection
        const allSessions = [...leaderSessions, ...memberSessions];
        
        // If no sessions found, show the dialog
        if (allSessions.length === 0) {
          setShowNoSessionsDialog(true);
          setActiveSession(null);
          // Check if we're on a session-specific path, if so redirect to voter
          const pathSegments = pathname.split('/');
          if (pathSegments.includes('team-leader') || pathSegments.includes('team-member')) {
            router.push('/voter');
          }
        } else {
          setShowNoSessionsDialog(false);
          
          // Find the current session from the pathname
          const currentSessionId = getSessionIdFromPath(allSessions);
          
          // Set the active session based on the current URL
          if (currentSessionId) {
            const currentSession = allSessions.find(session => session.id === currentSessionId);
            if (currentSession) {
              setActiveSession(currentSession);
            } else if (allSessions.length > 0) {
              // If current session not found in the list, set the first one as active
              setActiveSession(allSessions[0]);
            }
          } else if (allSessions.length > 0) {
            // If no session ID in the URL, set the first one as active
            setActiveSession(allSessions[0]);
          }
        }
      } catch (error: any) {
        console.error('Error fetching teams and sessions:', error);
        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data);
        }
        setShowNoSessionsDialog(true);
        setActiveSession(null);
        
        // If we're on a session-specific path and there's an error, redirect to voter
        const pathSegments = pathname.split('/');
        if (pathSegments.includes('team-leader') || pathSegments.includes('team-member')) {
          router.push('/voter');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch sessions when the component mounts and when the pathname changes
  useEffect(() => {
    fetchSessions()
  }, [pathname])

  // Get the session ID from the current path
  const getSessionIdFromPath = (sessions: SessionItem[]) => {
    const pathSegments = pathname.split('/')
    return pathSegments.find(segment => sessions.some(session => session.id === segment))
  }

  // Handle session selection
  const handleSessionSelect = (session: SessionItem) => {
    setActiveSession(session)
    
    // Extract the path segments
    const pathSegments = pathname.split('/')
    
    // Determine the role based on the session
    const roleSegment = session.role === "member" ? 'team-member' : 'team-leader'
    
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
  }

  // Handle creating a new session
  const handleCreateSession = () => {
    setIsPricingOpen(true)
  }

  const handlePlanSelected = (plan: "free" | "pro" | "enterprise") => {
    setIsPricingOpen(false)
    router.push(`/session-setup?plan=${plan}`)
  }

  // Handle navigating to voter page
  const handleGoToVoterPage = () => {
    router.push('/voter')
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

  const allSessions = [...mySessions, ...memberSessions]

  if (!activeSession && allSessions.length === 0) {
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
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-fit px-1.5"
              onClick={handleGoToVoterPage}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <Home className="size-3" />
              </div>
              <span className="truncate font-medium">Go to Voter Page</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    )
  }

  return (
    <>
      <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
      <PricingDialog 
        open={isPricingOpen} 
        onOpenChange={setIsPricingOpen} 
        onPlanSelected={handlePlanSelected} 
      />
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
                    {activeSession.role && (
                      <Badge variant={activeSession.role === "leader" ? "default" : "secondary"} className="ml-1 text-xs">
                        {activeSession.role === "leader" ? "Leader" : "Member"}
                      </Badge>
                    )}
                    <ChevronDown className="opacity-50" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              {mySessions.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs">
                    <User className="size-3" />
                    My Sessions
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {mySessions.map((session) => {
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
                          <Badge variant="default" className="text-xs">Leader</Badge>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                  {memberSessions.length > 0 && <DropdownMenuSeparator />}
                </>
              )}
              
              {memberSessions.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Users className="size-3" />
                    My Sessions as Member
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {memberSessions.map((session) => {
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
                          <Badge variant="secondary" className="text-xs">Member</Badge>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="gap-2 p-2" onClick={handleGoToVoterPage}>
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Home className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Go to Voter Page</div>
              </DropdownMenuItem>
              
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
