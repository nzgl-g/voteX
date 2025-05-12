"use client"

import * as React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { ChevronDown, Plus, Vote, BarChart, Trophy, Loader2, AlertCircle, User, Users, Home, RefreshCw, Link2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { PricingDialog } from "@/components/pricing-dialog"
import { sessionService, type Session } from "@/services/session-service"
import { toast } from "sonner"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils"

// Define session type for the team selector
interface SessionItem {
  id: string;
  name: string;
  type: "poll" | "election" | "tournament";
  plan: string;
  role?: "leader" | "member";
  hasBlockchainContract?: boolean;
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
  const [error, setError] = useState<string | null>(null)
  const [showNoSessionsDialog, setShowNoSessionsDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  
  // For tracking fetch state and preventing loops
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef<number>(0)
  const shouldRedirectOnErrorRef = useRef(true)
  
  // Cache session data to avoid unnecessary API calls
  const mySessionsCacheRef = useRef<Map<string, Session>>(new Map())
  const memberSessionsCacheRef = useRef<Map<string, Session>>(new Map())
  const currentSessionIdRef = useRef<string | null>(null)

  // Extract current session ID whenever pathname changes
  useEffect(() => {
    const pathSegments = pathname.split('/')
    const possibleSessionId = pathSegments.find(segment => /^[0-9a-fA-F]{24}$/.test(segment))
    currentSessionIdRef.current = possibleSessionId || null
  }, [pathname])
  
  /**
   * Create session item from raw session data
   */
  const createSessionItem = useCallback((
    sessionData: Session,
    role: "leader" | "member"
  ): SessionItem => {
    return {
      id: sessionData._id || "",
      name: sessionData.name || "Unnamed Session",
      type: sessionData.type || "poll",
      plan: sessionData.subscription?.name || "free",
      role,
      hasBlockchainContract: !!sessionData.contractAddress
    }
  }, [])
  
  /**
   * Fetch sessions using direct session service endpoints
   */
  const fetchSessions = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent fetches and throttle requests to avoid API spam
    const now = Date.now()
    if (
      isFetchingRef.current ||
      (!forceRefresh && now - lastFetchTimeRef.current < 30000) // 30-second cache unless forced
    ) return
    
    isFetchingRef.current = true
    
    // Clear caches on force refresh
    if (forceRefresh) {
      mySessionsCacheRef.current.clear()
      memberSessionsCacheRef.current.clear()
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const leaderSessions: SessionItem[] = []
      const memberSessions: SessionItem[] = []
      
      // Fetch leader sessions with direct API endpoint
      try {
        const mySessionsData = await sessionService.getUserSessions()
        
        if (Array.isArray(mySessionsData)) {
          // Process and add to leader sessions
          mySessionsData.forEach(sessionData => {
            if (sessionData && sessionData._id) {
              // Cache the session data
              mySessionsCacheRef.current.set(sessionData._id, sessionData)
              
              // Create UI session item
              const sessionItem = createSessionItem(sessionData, "leader")
              leaderSessions.push(sessionItem)
            }
          })
        }
      } catch (err) {
        console.error("Failed to fetch user's leader sessions:", err)
        if (!forceRefresh) {
          toast.error("Failed to load your sessions", {
            id: "leader-sessions-error",
            duration: 3000
          })
        }
      }
      
      // Fetch member sessions with direct API endpoint
      try {
        const memberSessionsResponse = await sessionService.getUserSessionsAsMember()
        const memberSessionsData = memberSessionsResponse.sessions
        
        if (Array.isArray(memberSessionsData)) {
          // Process and add to member sessions
          memberSessionsData.forEach(sessionData => {
            if (sessionData && sessionData._id) {
              // Cache the session data
              memberSessionsCacheRef.current.set(sessionData._id, sessionData)
              
              // Create UI session item
              const sessionItem = createSessionItem(sessionData, "member")
              memberSessions.push(sessionItem)
            }
          })
        }
      } catch (err) {
        console.error("Failed to fetch user's member sessions:", err)
        if (!forceRefresh) {
          toast.error("Failed to load your member sessions", {
            id: "member-sessions-error",
            duration: 3000
          })
        }
      }
      
      // Update state with results
      setMySessions(leaderSessions)
      setMemberSessions(memberSessions)
      
      // Combined sessions for active detection
      const allSessions = [...leaderSessions, ...memberSessions]
      
      // Show empty state if no sessions
      if (allSessions.length === 0) {
        setShowNoSessionsDialog(true)
        setActiveSession(null)
        
        // Only redirect if we should
        if (shouldRedirectOnErrorRef.current) {
          const pathSegments = pathname.split('/')
          if (pathSegments.includes('team-leader') || pathSegments.includes('team-member')) {
            router.push('/voter')
          }
        }
      } else {
        setShowNoSessionsDialog(false)
        
        // Find the current session from the pathname
        const currentSessionId = getSessionIdFromPath(allSessions)
        
        // Set the active session based on URL
        if (currentSessionId) {
          const currentSession = allSessions.find(session => session.id === currentSessionId)
          if (currentSession) {
            setActiveSession(currentSession)
          } else if (allSessions.length > 0) {
            setActiveSession(allSessions[0])
          }
        } else if (allSessions.length > 0) {
          setActiveSession(allSessions[0])
        }
      }
      
      // Record successful fetch time
      lastFetchTimeRef.current = Date.now()
    } catch (err: any) {
      setError(err.message || "Failed to load sessions")
      setShowNoSessionsDialog(true)
      
      // Only show one error toast
      if (!forceRefresh) { // Don't show on manual refresh to avoid spam
        toast.error("Session data couldn't be loaded", {
          description: "Please try again or contact support if the problem persists.",
          action: {
            label: "Retry",
            onClick: () => {
              shouldRedirectOnErrorRef.current = false
              fetchSessions(true) // Force refresh on manual retry
            }
          }
        })
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [createSessionItem, router, pathname])
  
  // Debounced version of the fetch function to prevent too many refreshes
  const debouncedFetchSessions = useDebouncedCallback(fetchSessions, 500)
  
  // Fetch sessions on mount and pathname change
  useEffect(() => {
    debouncedFetchSessions()
  }, [debouncedFetchSessions])
  
  // Extract session ID from path
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
    
    // Navigate to the selected session
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
  
  // Memoized combined sessions array
  const allSessions = useMemo(() => [...mySessions, ...memberSessions], [mySessions, memberSessions])
  
  // Loading state
  if (loading && allSessions.length === 0) {
    return (
      <>
        <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-primary/10 text-primary flex aspect-square size-5 items-center justify-center rounded-md">
                <Loader2 className="size-3 animate-spin" />
              </div>
              <span className="truncate font-medium">Loading sessions...</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    )
  }
  
  // Error state with no sessions
  if (error && !loading && allSessions.length === 0) {
    return (
      <>
        <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-fit px-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleCreateSession}
            >
              <div className="bg-muted/50 text-muted-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <Plus className="size-3" />
              </div>
              <span className="truncate font-medium">Create new session</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-fit px-1.5 flex gap-1"
              onClick={() => {
                shouldRedirectOnErrorRef.current = false
                fetchSessions(true) // Force refresh
              }}
            >
              <div className="bg-primary/10 text-primary flex aspect-square size-5 items-center justify-center rounded-md">
                <RefreshCw className="size-3" />
              </div>
              <span className="truncate font-medium">Refresh sessions</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-fit px-1.5"
              onClick={handleGoToVoterPage}
            >
              <div className="bg-muted/50 text-muted-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <Home className="size-3" />
              </div>
              <span className="truncate font-medium">Go to Voter Page</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    )
  }
  
  // No sessions state
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
              <div className="bg-primary/10 text-primary flex aspect-square size-5 items-center justify-center rounded-md">
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
              <div className="bg-muted/50 text-muted-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <Home className="size-3" />
              </div>
              <span className="truncate font-medium">Go to Voter Page</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    )
  }
  
  // Session selector UI with loading indicator during subsequent fetches
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
              <SidebarMenuButton className="w-full px-2 justify-between gap-0 group">
                {activeSession && (
                  <>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <div className="bg-primary/10 text-primary flex aspect-square size-5 items-center justify-center rounded-md shrink-0">
                        {React.createElement(getSessionIcon(activeSession.type), { className: "size-3" })}
                      </div>
                      <span className="truncate font-medium">{activeSession.name}</span>
                      {activeSession.hasBlockchainContract && (
                        <div className="bg-amber-500/10 text-amber-500 flex aspect-square size-4 items-center justify-center rounded-sm shrink-0">
                          <Link2 className="size-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {loading && <Loader2 className="size-3 animate-spin" />}
                      {activeSession.role && (
                        <Badge 
                          variant={activeSession.role === "leader" ? "default" : "secondary"} 
                          className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap"
                        >
                          {activeSession.role === "leader" ? "Leader" : "Member"}
                        </Badge>
                      )}
                      <ChevronDown className="size-4 opacity-50" />
                    </div>
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[calc(var(--sidebar-width)-16px)] max-w-[280px] rounded-lg"
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
                          <div className="flex size-6 items-center justify-center rounded-md border bg-primary/10">
                            <SessionIcon className="size-4 text-primary" />
                          </div>
                          <div className="flex-1 truncate">
                            {session.name}
                            {session.hasBlockchainContract && (
                              <span className="ml-1 inline-flex items-center">
                                <Link2 className="size-3 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <Badge 
                            variant="default" 
                            className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                          >
                            Leader
                          </Badge>
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
                          <div className="flex size-6 items-center justify-center rounded-md border bg-secondary/10">
                            <SessionIcon className="size-4 text-secondary" />
                          </div>
                          <div className="flex-1 truncate">
                            {session.name}
                            {session.hasBlockchainContract && (
                              <span className="ml-1 inline-flex items-center">
                                <Link2 className="size-3 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                          >
                            Member
                          </Badge>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="gap-2 p-2" 
                onClick={() => {
                  shouldRedirectOnErrorRef.current = false
                  fetchSessions(true) // Force refresh on manual refresh
                }}
              >
                <div className={cn(
                  "flex size-6 items-center justify-center rounded-md border",
                  loading ? "bg-primary/10" : "bg-muted/30"
                )}>
                  <RefreshCw className={cn(
                    "size-4",
                    loading ? "text-primary animate-spin" : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-muted-foreground font-medium">
                  {loading ? "Refreshing..." : "Refresh Sessions"}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="gap-2 p-2" onClick={handleGoToVoterPage}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-muted/30">
                  <Home className="size-4 text-muted-foreground" />
                </div>
                <div className="text-muted-foreground font-medium">Go to Voter Page</div>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="gap-2 p-2" onClick={handleCreateSession}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-primary/10">
                  <Plus className="size-4 text-primary" />
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
