"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSkeleton } from "@/components/monitoring/dashboard-skeleton"
import apiClient from "@/lib/api"

export default function TeamMemberMonitoringDefaultPage() {
  const router = useRouter()

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token')
        
        // Try to fetch team member sessions with authentication
        const response = await apiClient.get('/sessions/my-sessions-as-member')
        const data = response.data
        
        if (data.sessions && data.sessions.length > 0) {
          // Redirect to the first session
          router.push(`/team-member/monitoring/${data.sessions[0]._id}`)
        } else {
          // No sessions found, redirect to voter portal
          router.push('/voter')
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
        // Error occurred, redirect to voter portal
        router.push('/voter')
      }
    }

    fetchSessions()
  }, [router])

  // Show loading skeleton while fetching sessions
  return <DashboardSkeleton />
}
