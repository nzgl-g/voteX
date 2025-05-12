"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import BigCalendar from "@/components/event-calendar/big-calendar"
import { CalendarProvider } from "@/components/event-calendar/calendar-context"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Loader2, Plus } from "lucide-react"
import { baseApi } from "@/services"

export default function SchedulerPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionExists, setSessionExists] = useState(false)
  const [userSessions, setUserSessions] = useState<any[]>([])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First fetch all user sessions to check if any exist
        const userSessionsResponse = await baseApi.get('/sessions/my-sessions')
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
          router.replace(`/team-leader/scheduler/${userSessionsData[0]._id}`)
          return
        }
        
        // Check if the requested session exists
        const sessionExists = userSessionsData.some((session: { _id: string }) => session._id === sessionId)
        if (!sessionExists) {
          setLoading(false)
          setError("The requested session could not be found.")
          return
        }
        
        // Session exists, proceed with loading the dashboard
        setSessionExists(true)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching sessions:", err)
        setLoading(false)
        setError("Failed to load your sessions. Please try again.")
      }
    }
    
    if (sessionId) {
      fetchData()
    }
  }, [sessionId, router])
  
  const handleCreateSession = () => {
    router.push("/subscription")
  }
  
  if (loading) {
    return (
      <>
        <SiteHeader title="Loading scheduler..." />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-slate-600 dark:text-slate-400">Loading your session data...</p>
          </div>
        </div>
      </>
    )
  }
  
  if (error) {
    return (
      <>
        <SiteHeader title="Scheduler" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {error.includes("not found") ? "Session Not Found" : "No Sessions Found"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error}
            </p>
            {userSessions.length > 0 ? (
              <button 
                onClick={() => router.push(`/team-leader/scheduler/${userSessions[0]._id}`)}
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
    <div className="flex h-full flex-col space-y-4">
      <SiteHeader title="Scheduler" />
      <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
        <CalendarProvider>
          <BigCalendar sessionId={sessionId} />
        </CalendarProvider>
      </div>
    </div>
  )
}
