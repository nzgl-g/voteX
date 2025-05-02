"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { CalendarClock, CalendarDays, Award, BarChart2, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/shadcn-ui/badge"

interface Session {
  id: string
  name: string
  type: "poll" | "election" | "tournament"
  startDate: string | null
  endDate: string | null
  status: "draft" | "scheduled" | "active" | "completed"
  eventsCount: number
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
    eventsCount: 5
  },
  {
    id: "session-2",
    name: "Board Member Survey",
    type: "poll",
    startDate: null,
    endDate: null,
    status: "draft",
    eventsCount: 0
  },
  {
    id: "session-3",
    name: "Company Sports Tournament",
    type: "tournament",
    startDate: "2023-10-15T08:00:00Z",
    endDate: "2023-10-25T20:00:00Z",
    status: "active",
    eventsCount: 12
  }
]

export default function TeamMemberSchedulerDefaultPage() {
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
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled"
    
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const navigateToScheduler = (id: string) => {
    router.push(`/team-member/scheduler/${id}`)
  }

  return (
    <>
      <SiteHeader title="Scheduler" />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Schedule Events</h2>
          <p className="text-muted-foreground">
            Manage session timelines and schedule important events
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-3 text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No sessions available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see sessions here once you're added to them
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-gray-100 mr-3">
                          {getSessionIcon(session.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{session.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {session.type}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center">
                          <CalendarClock className="h-3.5 w-3.5 mr-1" />
                          Start date:
                        </span>
                        <span>{formatDate(session.startDate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center">
                          <CalendarClock className="h-3.5 w-3.5 mr-1" />
                          End date:
                        </span>
                        <span>{formatDate(session.endDate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center">
                          <CalendarDays className="h-3.5 w-3.5 mr-1" />
                          Events:
                        </span>
                        <span>{session.eventsCount}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => navigateToScheduler(session.id)}
                      variant={session.eventsCount > 0 ? "default" : "outline"}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {session.eventsCount > 0 ? "View Schedule" : "Add Events"}
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