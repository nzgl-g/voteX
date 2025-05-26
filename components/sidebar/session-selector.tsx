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

export function SessionSelector({ userRole = 'team-leader' }: { userRole?: string }) {
  const [mySessions, setMySessions] = useState<SessionItem[]>([])
  const [memberSessions, setMemberSessions] = useState<SessionItem[]>([])
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNoSessionsDialog, setShowNoSessionsDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isTriggerHovered, setIsTriggerHovered] = useState(false); // State for trigger hover

  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef<number>(0)
  const shouldRedirectOnErrorRef = useRef(true)

  const mySessionsCacheRef = useRef<Map<string, Session>>(new Map())
  const memberSessionsCacheRef = useRef<Map<string, Session>>(new Map())
  const currentSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const pathSegments = pathname.split('/')
    const possibleSessionId = pathSegments.find(segment => /^[0-9a-fA-F]{24}$/.test(segment))
    currentSessionIdRef.current = possibleSessionId || null
  }, [pathname])

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

  const fetchSessions = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    if (
        isFetchingRef.current ||
        (!forceRefresh && now - lastFetchTimeRef.current < 30000)
    ) return

    isFetchingRef.current = true

    if (forceRefresh) {
      mySessionsCacheRef.current.clear()
      memberSessionsCacheRef.current.clear()
    }

    try {
      setLoading(true)
      setError(null)

      const leaderSessions: SessionItem[] = []
      const memberSessionsList: SessionItem[] = [] // Renamed to avoid conflict with state setter

      try {
        const mySessionsData = await sessionService.getUserSessions()
        if (Array.isArray(mySessionsData)) {
          mySessionsData.forEach(sessionData => {
            if (sessionData && sessionData._id) {
              mySessionsCacheRef.current.set(sessionData._id, sessionData)
              const sessionItem = createSessionItem(sessionData, "leader")
              leaderSessions.push(sessionItem)
            }
          })
        }
      } catch (err) {
        console.error("Failed to fetch user's leader sessions:", err)
        if (!forceRefresh) {
          toast.error("Failed to load your sessions", { id: "leader-sessions-error", duration: 3000 })
        }
      }

      try {
        const memberSessionsResponse = await sessionService.getUserSessionsAsMember()
        const memberSessionsData = memberSessionsResponse.sessions
        if (Array.isArray(memberSessionsData)) {
          memberSessionsData.forEach(sessionData => {
            if (sessionData && sessionData._id) {
              memberSessionsCacheRef.current.set(sessionData._id, sessionData)
              const sessionItem = createSessionItem(sessionData, "member")
              memberSessionsList.push(sessionItem)
            }
          })
        }
      } catch (err) {
        console.error("Failed to fetch user's member sessions:", err)
        if (!forceRefresh) {
          toast.error("Failed to load your member sessions", { id: "member-sessions-error", duration: 3000 })
        }
      }

      setMySessions(leaderSessions)
      setMemberSessions(memberSessionsList) // Use renamed variable

      const allCombinedSessions = [...leaderSessions, ...memberSessionsList] // Use renamed variable

      if (allCombinedSessions.length === 0) {
        setShowNoSessionsDialog(true)
        setActiveSession(null)
        if (shouldRedirectOnErrorRef.current) {
          const pathSegments = pathname.split('/')
          if (pathSegments.includes('team-leader') || pathSegments.includes('team-member')) {
            router.push('/voter')
          }
        }
      } else {
        setShowNoSessionsDialog(false)
        const currentSessionId = getSessionIdFromPath(allCombinedSessions)
        if (currentSessionId) {
          const currentSession = allCombinedSessions.find(session => session.id === currentSessionId)
          if (currentSession) {
            setActiveSession(currentSession)
          } else { // Fallback to the first session if current ID is invalid or not found
            setActiveSession(allCombinedSessions[0])
          }
        } else { // Fallback if no session ID in path
          setActiveSession(allCombinedSessions[0])
        }
      }
      lastFetchTimeRef.current = Date.now()
    } catch (err: any) {
      setError(err.message || "Failed to load sessions")
      setShowNoSessionsDialog(true)
      if (!forceRefresh) {
        toast.error("Session data couldn't be loaded", {
          description: "Please try again or contact support if the problem persists.",
          action: {
            label: "Retry",
            onClick: () => {
              shouldRedirectOnErrorRef.current = false
              fetchSessions(true)
            }
          }
        })
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [createSessionItem, router, pathname]) // Removed getSessionIdFromPath from deps as it's defined inside

  const debouncedFetchSessions = useDebouncedCallback(fetchSessions, 500)

  useEffect(() => {
    debouncedFetchSessions()
  }, [debouncedFetchSessions])

  // Build URL based on session and role
  const buildSessionUrl = useCallback((sessionId: string, section: string = 'session') => {
    // Use provided role instead of hardcoded path
    return `/${userRole}/${section}/${sessionId}`;
  }, [userRole]);

  const getSessionIdFromPath = useCallback((sessions: SessionItem[]) => {
    // Extract session ID from the path
    const pathSegments = pathname.split('/')
    const possibleSessionId = pathSegments.find(segment => /^[0-9a-fA-F]{24}$/.test(segment))
    
    // Find the session in the provided list
    if (possibleSessionId) {
      const sessionMatch = sessions.find(session => session.id === possibleSessionId)
      if (sessionMatch) {
        setActiveSession(sessionMatch)
        return possibleSessionId
      }
    }
    
    // Check if we're on a default page - for both team-leader and team-member paths
    const isTeamLeaderPath = pathname.includes('/team-leader/')
    const isTeamMemberPath = pathname.includes('/team-member/')
    
    if ((isTeamLeaderPath || isTeamMemberPath) && pathname.includes('/default')) {
      // Filter sessions based on the current path role
      const filteredSessions = isTeamMemberPath 
        ? sessions.filter(s => s.role === 'member')
        : sessions.filter(s => s.role !== 'member')
      
      // Use role-appropriate sessions if available, otherwise fall back to all sessions
      const relevantSessions = filteredSessions.length > 0 ? filteredSessions : sessions
      
      if (relevantSessions.length > 0) {
        const firstSession = relevantSessions[0]
        setActiveSession(firstSession)
        
        // Determine which role path to use
        const rolePath = isTeamMemberPath ? 'team-member' : 'team-leader'
        
        // Get the section segment (monitoring, session, etc.)
        const segment = pathname.split('/').filter(p => p !== '')[1] || 'session'
        
        // Build the URL with the correct role path
        const url = `/${rolePath}/${segment}/${firstSession.id}`
        
        // Only redirect if we're not already in the process
        if (!isFetchingRef.current && shouldRedirectOnErrorRef.current) {
          setTimeout(() => {
            router.replace(url)
          }, 100)
        }
        
        return firstSession.id
      }
    }
    
    return null
  }, [pathname, router]);

  const handleSessionSelect = (session: SessionItem) => {
    setActiveSession(session)
    
    // Determine the correct role path based on the session role
    const sessionRole = session.role === "member" ? "team-member" : "team-leader"
    
    // Get the current path segment if available
    const pathSegments = pathname.split('/')
    let sectionSegment = 'session'
    
    // Try to preserve the current section (monitoring, session, etc.) when switching sessions
    if (pathSegments.length > 2) {
      const possibleSection = pathSegments[2]
      // Only use the segment if it's not a session ID
      if (possibleSection && !/^[0-9a-fA-F]{24}$/.test(possibleSection)) {
        sectionSegment = possibleSection
      }
    }
    
    // Build the URL with the correct role and section
    const url = `/${sessionRole}/${sectionSegment}/${session.id}`
    
    // Navigate to the appropriate dashboard based on the session role
    router.push(url)
  }

  const handleCreateNewSession = () => { // Renamed to avoid conflict
    setIsPricingOpen(true)
  }

  const handlePlanSelectedAndNavigate = (plan: "free" | "pro" | "enterprise") => { // Renamed
    setIsPricingOpen(false)
    router.push(`/session-setup?plan=${plan}`)
  }

  const handleGoToVoterPage = () => {
    router.push('/voter')
  }

  const getSessionIcon = (type: string) => {
    switch (type) {
      case "poll": return Vote
      case "election": return BarChart
      case "tournament": return Trophy
      default: return Vote
    }
  }

  const allSessions = useMemo(() => [...mySessions, ...memberSessions], [mySessions, memberSessions])

  // Standardized class names for menu item icons
  const menuItemIconContainerClass = "flex size-7 items-center justify-center rounded-md border shrink-0";
  const menuItemIconClass = "size-4";

  if (loading && allSessions.length === 0) {
    return (
        <>
          <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="w-fit px-1.5">
                <div className="bg-primary/10 text-primary flex aspect-square size-6 items-center justify-center rounded-md"> {/* Adjusted size */}
                  <Loader2 className="size-3.5 animate-spin" /> {/* Adjusted size */}
                </div>
                <span className="truncate font-medium text-sm">Loading sessions...</span> {/* Adjusted size */}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </>
    )
  }

  if (error && !loading && allSessions.length === 0) {
    return (
        <>
          <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  className="w-fit px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleCreateNewSession}
              >
                <div className="bg-muted/50 text-muted-foreground flex aspect-square size-6 items-center justify-center rounded-md">
                  <Plus className="size-3.5" />
                </div>
                <span className="truncate font-medium text-sm">Create new session</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                  className="w-fit px-1.5 flex gap-1.5" // Adjusted gap
                  onClick={() => {
                    shouldRedirectOnErrorRef.current = false
                    fetchSessions(true)
                  }}
              >
                <div className="bg-primary/10 text-primary flex aspect-square size-6 items-center justify-center rounded-md">
                  <RefreshCw className="size-3.5" />
                </div>
                <span className="truncate font-medium text-sm">Refresh sessions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                  className="w-fit px-1.5"
                  onClick={handleGoToVoterPage}
              >
                <div className="bg-muted/50 text-muted-foreground flex aspect-square size-6 items-center justify-center rounded-md">
                  <Home className="size-3.5" />
                </div>
                <span className="truncate font-medium text-sm">Go to Voter Page</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </>
    )
  }

  if (!activeSession && allSessions.length === 0 && !loading) { // Added !loading to ensure this shows after load if truly empty
    return (
        <>
          <NoSessionsDialog open={showNoSessionsDialog} onOpenChange={setShowNoSessionsDialog} />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  className="w-fit px-1.5"
                  onClick={handleCreateNewSession}
              >
                <div className="bg-primary/10 text-primary flex aspect-square size-6 items-center justify-center rounded-md">
                  <Plus className="size-3.5" />
                </div>
                <span className="truncate font-medium text-sm">Create your first session</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                  className="w-fit px-1.5"
                  onClick={handleGoToVoterPage}
              >
                <div className="bg-muted/50 text-muted-foreground flex aspect-square size-6 items-center justify-center rounded-md">
                  <Home className="size-3.5" />
                </div>
                <span className="truncate font-medium text-sm">Go to Voter Page</span>
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
            onPlanSelected={handlePlanSelectedAndNavigate}
        />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                    className="w-full px-2.5 py-2 justify-between items-center gap-2 group h-11"
                    onMouseEnter={() => setIsTriggerHovered(true)}
                    onMouseLeave={() => setIsTriggerHovered(false)}
                    disabled={!activeSession || (loading && allSessions.length === 0)}
                >
                  {activeSession ? (
                      <>
                        {/* Left Part: Icon + Session Name (Always Truncated) */}
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                          <div className={cn(
                              "flex aspect-square items-center justify-center rounded-md shrink-0",
                              "bg-primary/10 text-primary size-7"
                          )}>
                            {React.createElement(getSessionIcon(activeSession.type), { className: "size-4" })}
                          </div>
                          {/* ---- MODIFIED LINE BELOW ---- */}
                          <span className={cn(
                              "font-semibold text-sm",
                              "truncate text-foreground/90" // Ensures the text is always truncated
                              // and does not change to whitespace-normal on hover.
                          )}>
                        {activeSession.name}
                      </span>
                          {/* ---- END MODIFICATION ---- */}
                        </div>

                        {/* Right Part: Loader, Hover elements + Chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Loader: Shown if loading and trigger is NOT hovered */}
                          {loading && !isTriggerHovered && <Loader2 className="size-4 animate-spin text-muted-foreground" />}

                          {/* Badge and Link Icon: Shown if trigger IS hovered and NOT loading */}
                          {isTriggerHovered && !loading && (
                              <>
                                {activeSession.role && (
                                    <Badge
                                        variant={activeSession.role === "leader" ? "default" : "outline"}
                                        className="h-6 px-2.5 text-xs font-medium"
                                    >
                                      {activeSession.role === "leader" ? "Leader" : "Member"}
                                    </Badge>
                                )}
                                {activeSession.hasBlockchainContract && (
                                    <div title="Linked to blockchain" className="text-sky-500 hover:text-sky-600 transition-colors">
                                      <Link2 className="size-4 stroke-[2.5px]" />
                                    </div>
                                )}
                              </>
                          )}
                          <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </>
                  ) : (
                      // Fallback when activeSession is null (e.g., during initial loading)
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="bg-muted/30 flex aspect-square size-7 items-center justify-center rounded-md shrink-0 animate-pulse"></div>
                        <span className="font-medium text-sm text-muted-foreground truncate">
                        {allSessions.length > 0 ? "Select session..." : (loading ? "Loading..." : "No active session")}
                      </span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>              <DropdownMenuContent
                  className={cn(
                      "w-[calc(var(--sidebar-width)-16px)] max-w-[280px] rounded-lg shadow-xl",
                      "bg-card/85 backdrop-blur-lg border border-border/30" // Apple-like blur effect
                  )}
                  align="start"
                  side="bottom"
                  sideOffset={6}
              >
                {mySessions.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs px-2.5 py-2">
                        <User className="size-3.5" />
                        My Sessions
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        {mySessions.map((session) => {
                          const SessionIcon = getSessionIcon(session.type);
                          return (
                              <DropdownMenuItem
                                  key={session.id}
                                  onClick={() => handleSessionSelect(session)}
                                  className="gap-2.5 p-2.5 items-center"
                                  disabled={session.id === activeSession?.id}
                              >
                                <div className={cn(menuItemIconContainerClass, "bg-primary/10 border-primary/20")}>
                                  <SessionIcon className={cn(menuItemIconClass, "text-primary")} />
                                </div>
                                <div className="flex-1 truncate text-sm font-medium">
                                  {session.name}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {session.hasBlockchainContract && (
                                      <Link2  className="size-3.5 text-sky-500 stroke-[2px]" />
                                  )}
                                  <Badge
                                      variant="default"
                                      className="h-5 px-2 text-[11px] font-medium"
                                  >
                                    Leader
                                  </Badge>
                                </div>
                              </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuGroup>
                      {memberSessions.length > 0 && <DropdownMenuSeparator className="my-1.5" />}
                    </>
                )}

                {memberSessions.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs px-2.5 py-2">
                        <Users className="size-3.5" />
                        My Sessions as Member
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        {memberSessions.map((session) => {
                          const SessionIcon = getSessionIcon(session.type);
                          return (
                              <DropdownMenuItem
                                  key={session.id}
                                  onClick={() => handleSessionSelect(session)}
                                  className="gap-2.5 p-2.5 items-center"
                                  disabled={session.id === activeSession?.id}
                              >
                                <div className={cn(menuItemIconContainerClass, "bg-secondary/10 border-secondary/20 text-secondary-foreground")}>
                                  <SessionIcon className={cn(menuItemIconClass, "text-secondary-foreground/80")} />
                                </div>
                                <div className="flex-1 truncate text-sm font-medium">
                                  {session.name}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {session.hasBlockchainContract && (
                                      <Link2  className="size-3.5 text-sky-500 stroke-[2px]" />
                                  )}
                                  <Badge
                                      variant="secondary"
                                      className="h-5 px-2 text-[11px] font-medium"
                                  >
                                    Member
                                  </Badge>
                                </div>
                              </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuGroup>
                    </>
                )}

                {(mySessions.length > 0 || memberSessions.length > 0) && <DropdownMenuSeparator className="my-1.5" />}

                <DropdownMenuItem
                    className="gap-2.5 p-2.5 items-center"
                    onClick={() => {
                      shouldRedirectOnErrorRef.current = false;
                      fetchSessions(true);
                    }}
                >
                  <div className={cn(
                      menuItemIconContainerClass,
                      loading ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-muted/80"
                  )}>
                    <RefreshCw className={cn(
                        menuItemIconClass,
                        loading ? "text-primary animate-spin" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {loading ? "Refreshing..." : "Refresh Sessions"}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2.5 p-2.5 items-center" onClick={handleGoToVoterPage}>
                  <div className={cn(menuItemIconContainerClass, "bg-muted/50 border-muted/80")}>
                    <Home className={cn(menuItemIconClass, "text-muted-foreground")} />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Go to Voter Page</div>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2.5 p-2.5 items-center" onClick={handleCreateNewSession}>
                  <div className={cn(menuItemIconContainerClass, "bg-primary/10 border-primary/20")}>
                    <Plus className={cn(menuItemIconClass, "text-primary")} />
                  </div>
                  <div className="text-sm font-medium text-primary">Create New Session</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
  )
}