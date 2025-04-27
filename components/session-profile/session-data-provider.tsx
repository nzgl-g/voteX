"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import apiClient from "@/lib/api"
import { Session, Candidate, TeamMember } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Create context for session data
interface SessionContextType {
  session: Session | null
  candidates: Candidate[]
  teamMembers: TeamMember[]
  loading: boolean
  error: string | null
  fetchSession: (sessionId: string) => Promise<void>
  updateSession: (updatedData: Partial<Session>) => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Provider component
export function SessionDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Function to normalize session data to ensure all required fields are present and in the correct format
  const normalizeSessionData = (sessionData: any) => {
    // Ensure sessionLifecycle has all required fields
    const normalizedSessionLifecycle = {
      createdAt: sessionData.sessionLifecycle?.createdAt || new Date().toISOString(),
      scheduledAt: {
        start: sessionData.sessionLifecycle?.scheduledAt?.start || sessionData.sessionLifecycle?.startedAt || new Date().toISOString(),
        end: sessionData.sessionLifecycle?.scheduledAt?.end || sessionData.sessionLifecycle?.endedAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      startedAt: sessionData.sessionLifecycle?.startedAt || new Date().toISOString(),
      endedAt: sessionData.sessionLifecycle?.endedAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Normalize the session data
    return {
      id: sessionData._id || sessionData.id,
      name: sessionData.name || 'Untitled Session',
      description: sessionData.description || '',
      organizationName: sessionData.organizationName || '',
      banner: sessionData.banner || null,
      sessionLifecycle: normalizedSessionLifecycle,
      type: sessionData.type || 'poll',
      subtype: sessionData.subtype || 'Single',
      tournamentType: sessionData.tournamentType || null,
      accessLevel: sessionData.accessLevel || 'Public',
      securityMethod: sessionData.securityMethod || null,
      verificationMethod: sessionData.verificationMethod || null,
      candidateStep: sessionData.candidateStep || 'Manual',
      candidates: sessionData.candidates || [],
      options: sessionData.options || [],
      subscription: sessionData.subscription || { name: 'free', price: 0, voterLimit: 100, features: [], isRecommended: false },
      teamMembers: []
    }
  }

  // Function to validate MongoDB ObjectId format
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Function to fetch session data by ID
  const fetchSession = async (sessionId: string) => {
    if (!sessionId) {
      console.error("No session ID provided")
      setError("No session ID provided")
      return
    }
    
    // Validate the session ID format
    if (!isValidObjectId(sessionId)) {
      console.error(`Invalid session ID format: ${sessionId}`)
      setError("Invalid session ID format")
      toast({
        title: "Error",
        description: "The session ID is not in a valid format.",
        variant: "destructive",
      })
      return
    }
    
    console.log(`Fetching session with ID: ${sessionId}`)
    setLoading(true)
    setError(null)
    
    try {
      // Fetch session data with error handling
      let sessionData;
      try {
        console.log(`Making API request to: /sessions/${sessionId}`)
        const sessionResponse = await apiClient.get(`/sessions/${sessionId}`)
        console.log("Session data received:", sessionResponse.data)
        sessionData = sessionResponse.data
      } catch (sessionError: any) {
        console.error("Error in session fetch:", sessionError)
        // Try an alternative endpoint format if the first one fails
        if (sessionError.response?.status === 500) {
          try {
            console.log("Trying alternative endpoint format...")
            const altResponse = await apiClient.get(`/session/${sessionId}`)
            console.log("Alternative endpoint successful:", altResponse.data)
            sessionData = altResponse.data
          } catch (altError) {
            console.error("Alternative endpoint also failed:", altError)
            throw sessionError // Re-throw the original error if alternative also fails
          }
        } else {
          throw sessionError
        }
      }
      
      if (!sessionData) {
        throw new Error("No session data returned from server")
      }
      
      const normalizedSession = normalizeSessionData(sessionData)
      console.log("Normalized session data:", normalizedSession)
      setSession(normalizedSession as Session)
      
      // Fetch candidates if it's an election or tournament
      if (normalizedSession.type === "election" || normalizedSession.type === "tournament") {
        try {
          console.log(`Fetching candidates for session: ${sessionId}`)
          // Try both endpoint formats
          let candidatesData = []
          try {
            const candidatesResponse = await apiClient.get(`/sessions/${sessionId}/candidate`)
            candidatesData = candidatesResponse.data || []
          } catch (error) {
            console.log("Trying alternative candidate endpoint...")
            try {
              const altCandidatesResponse = await apiClient.get(`/session/${sessionId}/candidate`)
              candidatesData = altCandidatesResponse.data || []
            } catch (altError) {
              console.error("All candidate endpoints failed", altError)
            }
          }
          setCandidates(candidatesData)
        } catch (candidateError) {
          console.error("Error fetching candidates:", candidateError)
          setCandidates([])
        }
      }
      
      // Fetch team members - try different approaches
      try {
        let teamData = null
        const teamId = sessionData.team || sessionId
        
        // First try with team ID
        if (teamId && isValidObjectId(teamId.toString())) {
          try {
            console.log(`Fetching team members for team ID: ${teamId}`)
            const teamResponse = await apiClient.get(`/teams/${teamId}`)
            teamData = teamResponse.data
          } catch (error) {
            console.log("Team ID endpoint failed, trying session ID...")
          }
        }
        
        // If that fails, try with session ID
        if (!teamData) {
          try {
            console.log(`Fetching team by session ID: ${sessionId}`)
            const teamBySessionResponse = await apiClient.get(`/teams/session/${sessionId}`)
            teamData = teamBySessionResponse.data
          } catch (error) {
            console.log("Team by session endpoint failed")
          }
        }
        
        if (teamData && teamData.members) {
          setTeamMembers(teamData.members)
        } else {
          setTeamMembers([])
        }
      } catch (teamError) {
        console.error("Error fetching team members:", teamError)
        setTeamMembers([])
      }
    } catch (error: any) {
      console.error("Error fetching session:", error)
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      setError(error.response?.data?.message || error.message || "Failed to fetch session data")
      
      toast({
        title: "Error",
        description: "Failed to load session data. Please try again.",
        variant: "destructive",
      })
      
      // Redirect to sessions list if session not found
      if (error.response?.status === 404) {
        router.push("/team-leader/sessions")
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to update session data
  const updateSession = async (updatedData: Partial<Session>) => {
    if (!session) return
    
    try {
      const response = await apiClient.put(`/sessions/${session.id}`, updatedData)
      
      setSession(prev => prev ? { ...prev, ...response.data } : response.data)
      
      toast({
        title: "Success",
        description: "Session updated successfully",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating session:", error)
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to update session",
        variant: "destructive",
      })
    }
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        candidates,
        teamMembers,
        loading,
        error,
        fetchSession,
        updateSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

// Custom hook to use the session context
export function useSessionData() {
  const context = useContext(SessionContext)
  
  if (context === undefined) {
    throw new Error("useSessionData must be used within a SessionDataProvider")
  }
  
  return context
}
