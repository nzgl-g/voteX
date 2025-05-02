"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { PlayCircle, StopCircle, Settings, Award, BarChart2, Calendar, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/shadcn-ui/badge"

interface Session {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "completed" | "draft"
  participantCount: number
}

// Mock sessions - in a real app, you would fetch these from an API
const mockSessions: Session[] = [
  {
    id: "session-1",
    name: "Presidential Election 2024",
    type: "election",
    startDate: "2023-12-01T10:00:00Z",
    endDate: "2023-12-15T23:59:59Z",
    status: "scheduled",
    participantCount: 1200
  },
  {
    id: "session-2",
    name: "Board Member Survey",
    type: "poll",
    startDate: "2023-11-10T09:00:00Z",
    endDate: "2023-11-20T18:00:00Z",
    status: "active",
    participantCount: 45
  },
  {
    id: "session-3",
    name: "Company Sports Tournament",
    type: "tournament",
    startDate: "2023-10-15T08:00:00Z",
    endDate: "2023-10-25T20:00:00Z",
    status: "draft",
    participantCount: 0
  }
]

export default function TeamMemberSessionDefaultPage() {
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
        toast({
          title: "Error",
          description: "Failed to load sessions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])
  
  const getSessionIcon = (type: string) => {
    switch (type) {
      case "poll":
        return <BarChart2 className="h-5 w-5 text-blue-500" />
      case "election":
        return <Award className="h-5 w-5 text-purple-500" />
      case "tournament":
        return <Calendar className="h-5 w-5 text-green-500" />
      default:
        return <BarChart2 className="h-5 w-5 text-blue-500" />
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>
      case "draft":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Draft</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const handleStartSession = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      // This would be an API call in a real app
      // await api.startSession(id)
      
      toast({
        title: "Session started",
        description: "The session has been started successfully.",
      })
      
      // Update the session status locally
      setSessions(prev => prev.map(s => 
        s.id === id ? {...s, status: "active"} : s
      ))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start the session. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const handleStopSession = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      // This would be an API call in a real app
      // await api.stopSession(id)
      
      toast({
        title: "Session ended",
        description: "The session has been ended successfully.",
      })
      
      // Update the session status locally
      setSessions(prev => prev.map(s => 
        s.id === id ? {...s, status: "completed"} : s
      ))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop the session. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const navigateToSession = (id: string) => {
    router.push(`/team-member/session/${id}`)
  }

  return (
    <>
      <SiteHeader title="Session Management" />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Manage Sessions</h2>
          <p className="text-muted-foreground">
            Start, stop, and manage sessions you have access to
          </p>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No sessions available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see sessions here once you're added to them
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateToSession(session.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getSessionIcon(session.type)}
                        </div>
                        <div>
                          <h3 className="font-medium">{session.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="capitalize">{session.type}</span>
                            <span>•</span>
                            <span>{session.participantCount} participants</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        
                        {/* Session controls - only show appropriate buttons based on status */}
                        <div className="flex space-x-2 ml-4">
                          {(session.status === "scheduled" || session.status === "draft") && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              onClick={(e) => handleStartSession(session.id, e)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          
                          {session.status === "active" && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                              onClick={(e) => handleStopSession(session.id, e)}
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              End
                            </Button>
                          )}
                          
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToSession(session.id)
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline indicator */}
                    <div className="px-4 pb-4 pt-0">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <div className="flex justify-between w-full">
                          <span>Start: {formatDate(session.startDate)}</span>
                          <span>End: {formatDate(session.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
} 