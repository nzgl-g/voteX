"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SessionProfile } from "@/components/profile/session-profile"
import { SiteHeader } from "@/components/sidebar/site-header"
import apiClient from "@/lib/api"
import type { Session, Candidate, TeamMember } from "@/lib/types"
import { Loader2, Plus } from "lucide-react"

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [userSessions, setUserSessions] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First fetch all user sessions to check if any exist
        const userSessionsResponse = await apiClient.get('/sessions/my-sessions')
        const userSessionsData = userSessionsResponse.data || []
        setUserSessions(userSessionsData)
        
        // If no sessions exist, show error message
        if (userSessionsData.length === 0) {
          setLoading(false)
          setError("You don't have any sessions yet. Create your first session to get started.")
          return
        }
        
        // If sessionId is 'default', redirect to the first session
        if (sessionId === 'default' && userSessionsData.length > 0) {
          router.replace(`/team-leader/session/${userSessionsData[0]._id}`)
          return
        }
        
        // Fetch specific session data
        const sessionResponse = await apiClient.get(`/sessions/${sessionId}`)
        
        if (!sessionResponse.data) {
          throw new Error("Session not found")
        }
        
        // Transform the session data to match the expected format
        const sessionData = {
          id: sessionResponse.data._id,
          name: sessionResponse.data.name,
          description: sessionResponse.data.description,
          organizationName: sessionResponse.data.organizationName,
          banner: sessionResponse.data.banner,
          sessionLifecycle: {
            createdAt: new Date(sessionResponse.data.sessionLifecycle.createdAt).toLocaleString(),
            scheduledAt: sessionResponse.data.sessionLifecycle.scheduledAt ? {
              start: sessionResponse.data.sessionLifecycle.scheduledAt.start ? 
                new Date(sessionResponse.data.sessionLifecycle.scheduledAt.start).toLocaleString() : null,
              end: sessionResponse.data.sessionLifecycle.scheduledAt.end ? 
                new Date(sessionResponse.data.sessionLifecycle.scheduledAt.end).toLocaleString() : null,
            } : null,
            startedAt: sessionResponse.data.sessionLifecycle.startedAt ? 
              new Date(sessionResponse.data.sessionLifecycle.startedAt).toLocaleString() : new Date().toLocaleString(),
            endedAt: sessionResponse.data.sessionLifecycle.endedAt ? 
              new Date(sessionResponse.data.sessionLifecycle.endedAt).toLocaleString() : new Date().toLocaleString(),
          },
          type: sessionResponse.data.type,
          subtype: sessionResponse.data.subtype,
          tournamentType: sessionResponse.data.tournamentType || null,
          accessLevel: sessionResponse.data.accessLevel || "Public",
          securityMethod: sessionResponse.data.securityMethod,
          verificationMethod: sessionResponse.data.verificationMethod,
          candidateStep: "Invitation" as "Invitation" | "Nomination", // Type assertion to match the expected type
          subscription: {
            id: sessionResponse.data.subscription?._id || "free",
            name: sessionResponse.data.subscription?.name || "free",
            price: sessionResponse.data.subscription?.price || 0,
            voterLimit: sessionResponse.data.subscription?.voterLimit || 100,
            features: sessionResponse.data.subscription?.features || [],
            isRecommended: sessionResponse.data.subscription?.isRecommended || false,
          },
          teamMembers: []
        }
        
        setSession(sessionData)
        
        // Extract candidates if available
        if (sessionResponse.data.type === "election" && sessionResponse.data.candidates) {
          const candidatesData = sessionResponse.data.candidates.map((candidate: any) => ({
            id: candidate._id || candidate.user?._id || `cand-${Math.random().toString(36).substr(2, 9)}`,
            fullName: candidate.user?.username || "Unknown",
            status: candidate.status || "Pending",
            assignedReviewer: null,
            partyName: candidate.partyName || "Independent",
            totalVotes: candidate.totalVotes || 0,
            requiresReview: candidate.requiresReview || false,
            sessionId: sessionId
          }))
          
          setCandidates(candidatesData)
        }
        
        // Fetch team data
        if (sessionResponse.data.team) {
          try {
            // Make sure we're using the correct teams endpoint and the team ID is a string
            const teamId = typeof sessionResponse.data.team === 'object' ? 
              sessionResponse.data.team._id : sessionResponse.data.team;
            const teamResponse = await apiClient.get(`/teams/${teamId}`)
            
            if (teamResponse.data && teamResponse.data.members) {
              const teamMembersData = teamResponse.data.members.map((member: any) => ({
                id: member._id || `member-${Math.random().toString(36).substr(2, 9)}`,
                fullName: member.username || "Unknown",
                role: member._id === teamResponse.data.leader ? "Leader" : "Member",
                email: member.email || "",
                sessionId: sessionId
              }))
              
              setTeamMembers(teamMembersData)
            }
          } catch (teamError) {
            console.error("Error fetching team data:", teamError)
            // Continue with empty team members rather than failing completely
          }
        }
      } catch (err) {
        console.error("Error fetching session data:", err)
        setError("Failed to load session data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionId) {
      fetchData()
    }
  }, [sessionId, router])
  
  if (loading) {
    return (
      <>
        <SiteHeader title="Loading session..." />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-slate-600 dark:text-slate-400">Loading session data...</p>
          </div>
        </div>
      </>
    )
  }
  
  const handleCreateSession = () => {
    router.push("/subscription")
  }
  
  if (error) {
    return (
      <>
        <SiteHeader title="Team Leader Dashboard" />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              No Sessions Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error}
            </p>
            <button 
              onClick={handleCreateSession}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Session
            </button>
          </div>
        </div>
      </>
    )
  }
  
  if (!session) {
    return (
      <>
        <SiteHeader title="Error" />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm max-w-md">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Session Not Found</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">The requested session could not be found.</p>
            {userSessions.length > 0 ? (
              <button 
                onClick={() => router.push(`/team-leader/session/${userSessions[0]._id}`)}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Available Session
              </button>
            ) : (
              <button 
                onClick={handleCreateSession}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Session
              </button>
            )}
          </div>
        </div>
      </>
    )
  }
  
  return (
    <>
      <SiteHeader title={`${session.name} - Dashboard`} />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <SessionProfile 
          session={session} 
          candidates={candidates} 
          teamMembers={teamMembers} 
        />
      </main>
    </>
  )
}
