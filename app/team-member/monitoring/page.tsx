"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { BarChart2, Calendar, Eye, Award, Users } from "lucide-react"
import { toast } from "sonner"

interface Session {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "completed"
  participantCount: number
  candidateCount: number
  nominationActive: boolean
}

// Mock sessions - in a real app, you would fetch these from an API
const mockSessions: Session[] = [
  {
    id: "session-1",
    name: "Presidential Election 2024",
    type: "election",
    startDate: "2023-12-01T10:00:00Z",
    endDate: "2023-12-15T23:59:59Z",
    status: "active",
    participantCount: 1200,
    candidateCount: 5,
    nominationActive: true
  },
  {
    id: "session-2",
    name: "Board Member Survey",
    type: "poll",
    startDate: "2023-11-10T09:00:00Z",
    endDate: "2023-11-20T18:00:00Z",
    status: "active",
    participantCount: 45,
    candidateCount: 3,
    nominationActive: false
  },
  {
    id: "session-3",
    name: "Company Sports Tournament",
    type: "tournament",
    startDate: "2023-10-15T08:00:00Z",
    endDate: "2023-10-25T20:00:00Z",
    status: "completed",
    participantCount: 128,
    candidateCount: 12,
    nominationActive: false
  }
]

export default function TeamMemberMonitoringPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to get sessions
    const fetchSessions = async () => {
      try {
        // In a real app, this would be an API call
        // const response = await api.getSessions()
        // setSessions(response.data)
        
        // Using mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSessions(mockSessions)
      } catch (error) {
        console.error("Error fetching sessions:", error)
        toast.error("Failed to load sessions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])
  
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const navigateToSession = (sessionId: string) => {
    router.push(`/team-member/monitoring/${sessionId}`)
  }

  return (
    <>
      <SiteHeader title="Available Sessions" />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            View and monitor sessions you have access to
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-2/3 mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-10 rounded-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No sessions available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see sessions here once you're added to them
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="line-clamp-1">{session.name}</CardTitle>
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
                    <div className="flex items-start mb-4">
                      {getSessionIcon(session.type)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Start:</span>
                        <span>{formatDate(session.startDate)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">End:</span>
                        <span>{formatDate(session.endDate)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Participants:</span>
                        <span>{session.participantCount}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Candidates:</span>
                        <span className="font-medium">{session.candidateCount}</span>
                      </p>
                      {session.nominationActive && (
                        <p className="mt-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Nominations Open
                          </span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => navigateToSession(session.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Monitor Session
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}
