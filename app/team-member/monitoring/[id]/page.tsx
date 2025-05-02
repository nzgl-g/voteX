"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { BarChart2, Calendar, User, Award, Users } from "lucide-react"
import { toast } from "sonner"
import { CandidateMonitorTable } from "@/components/session-profile/candidate-monitor-table"
import { CandidateRequestsTable } from "@/components/session-profile/candidate-requests-table"

interface Session {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "completed"
  participantCount: number
  nominationActive: boolean
}

// Mock session for demonstration
const mockSession: Session = {
  id: "session-1",
  name: "Presidential Election 2024",
  type: "election",
  startDate: "2023-12-01T10:00:00Z",
  endDate: "2023-12-15T23:59:59Z",
  status: "active",
  participantCount: 1200,
  nominationActive: true
}

export default function SessionMonitoringPage() {
  const params = useParams()
  const sessionIdParam = Array.isArray(params.id) ? params.id[0] : params.id
  const sessionId = sessionIdParam || "default-session-id"
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Simulate API call to get session data
    const fetchSession = async () => {
      try {
        // In a real app, this would be an API call
        // const response = await api.getSessionById(sessionId)
        // setSession(response.data)
        
        // Using mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSession(mockSession)
      } catch (error) {
        console.error("Error fetching session:", error)
        toast.error("Failed to load session data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const getSessionIcon = (type: string) => {
    switch (type) {
      case "poll":
        return <BarChart2 className="h-10 w-10 text-blue-500" />
      case "election":
        return <Award className="h-10 w-10 text-purple-500" />
      case "tournament":
        return <Calendar className="h-10 w-10 text-green-500" />
      default:
        return <BarChart2 className="h-10 w-10 text-blue-500" />
    }
  }

  return (
    <>
      <SiteHeader title={session?.name || "Session"} />
      <div className="container mx-auto py-6 px-4 md:px-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : session ? (
          <div className="space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{session.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {session.type}
                    </CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start">
                    {getSessionIcon(session.type)}
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Session Type</h3>
                      <p className="text-lg font-medium capitalize">{session.type}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-10 w-10 text-blue-500" />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Active Period</h3>
                      <p className="text-sm">
                        {formatDate(session.startDate)} - {formatDate(session.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-10 w-10 text-green-500" />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Participants</h3>
                      <p className="text-lg font-medium">{session.participantCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabs for different monitoring sections */}
            <Tabs defaultValue="candidates" className="w-full">
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
                <TabsTrigger value="candidates">
                  <User className="h-4 w-4 mr-2" />
                  Candidates
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <Award className="h-4 w-4 mr-2" />
                  Candidate Requests
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="candidates" className="mt-6">
                <CandidateMonitorTable sessionId={sessionId} />
              </TabsContent>
              
              <TabsContent value="requests" className="mt-6">
                <CandidateRequestsTable sessionId={sessionId} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg font-medium text-muted-foreground">Session not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
