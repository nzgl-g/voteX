"use client"

import { useState, useEffect } from "react"
import { CalendarDays, ChevronDown, FileText, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import { VotesOverTimeChart } from "./votes-over-time-chart"
import { CandidatesList } from "./candidates-list"
import { VoteDistributionChart } from "./vote-distribution-chart"
import { CountdownTimer } from "./countdown-timer"
import { TotalVotesCard } from "./total-votes-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn-ui/alert"
import { Loader2 } from "lucide-react"
import apiClient from "@/lib/api"
import { Badge } from "@/components/shadcn-ui/badge"

// Mock data - in a real app, this would come from an API
import { mockSession, mockVotesData, generateMockVotesOverTime } from "@/lib/mock"
import { Session, Candidate } from "@/lib/types"

// Extended Session type with additional properties needed for the dashboard
interface ExtendedSession extends Session {
  status?: string;
  totalVoters?: number;
}

interface VotingDashboardProps {
  sessionId: string
}

export default function VotingDashboard({ sessionId }: VotingDashboardProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day")
  const [session, setSession] = useState<ExtendedSession | null>(null)
  const [votesData, setVotesData] = useState(mockVotesData)
  const [votesOverTime, setVotesOverTime] = useState(generateMockVotesOverTime("day"))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<'not_started' | 'active' | 'ended'>('active')
  
  // Update mock data when time range changes
  useEffect(() => {
    setVotesOverTime(generateMockVotesOverTime(timeRange))
  }, [timeRange])
  
  // Fetch the real session data using the sessionId
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId || sessionId === 'default') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Get the token from localStorage
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }
        
        // Validate sessionId format (assuming it's a MongoDB ObjectId)
        if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
          throw new Error('Invalid session ID format')
        }
        
        console.log('Fetching session with ID:', sessionId)
        
        // Fetch session data from the API with authentication
        const response = await apiClient.get(`/sessions/${sessionId}`, {
          headers: {
            'Authorization': token
          }
        })
        
        if (!response.data) {
          throw new Error('Empty response received from server')
        }
        
        console.log('Session data received:', response.data)
        
        const sessionData = response.data
        
        // Transform API data to match the expected format if needed
        const formattedSession: ExtendedSession = {
          id: sessionData._id || sessionId,
          name: sessionData.name || 'Untitled Session',
          description: sessionData.description || '',
          organizationName: sessionData.organizationName || '',
          type: sessionData.type || 'poll',
          status: sessionData.status || 'active',
          sessionLifecycle: sessionData.sessionLifecycle || {
            createdAt: new Date().toISOString(),
            scheduledAt: {
              start: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            startedAt: new Date().toISOString(),
            endedAt: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
          },
          candidates: sessionData.candidates?.map((candidate: any) => ({
            id: candidate._id || candidate.id,
            fullName: candidate.fullName || 'Unknown Candidate',
            partyName: candidate.partyName || '',
            totalVotes: candidate.totalVotes || Math.floor(Math.random() * 1000)
          })) || [],
          subscription: sessionData.subscription || { 
            id: 'free', 
            name: 'free', 
            price: 0, 
            features: [], 
            isRecommended: false 
          },
          teamMembers: sessionData.teamMembers || [],
          totalVoters: sessionData.totalVoters || 1000,
          accessLevel: sessionData.accessLevel || 'Public',
          subtype: sessionData.subtype || 'Single',
          candidateStep: sessionData.candidateStep || 'Nomination'
        }
        
        setSession(formattedSession)
        
        // Determine session status based on lifecycle dates
        determineSessionStatus(formattedSession.sessionLifecycle);
        
      } catch (err) {
        console.error('Error fetching session data:', err)
        setError('Failed to load session data. Please try again later.')
        
        // Fallback to mock data with modifications if API fails
        const sessionIdSum = sessionId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
        const modifiedSession: ExtendedSession = {
          ...mockSession,
          id: sessionId,
          name: `${mockSession.name} ${sessionIdSum % 100}`,
          candidates: mockSession.candidates?.map(candidate => ({
            ...candidate,
            totalVotes: candidate.totalVotes + (sessionIdSum % 500)
          })),
          status: 'active',
          totalVoters: 1000
        }
        setSession(modifiedSession)
        
        // Determine session status based on lifecycle dates
        determineSessionStatus(modifiedSession.sessionLifecycle);
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessionData()
  }, [sessionId])
  
  // Determine session status based on lifecycle dates
  const determineSessionStatus = (lifecycle: Session['sessionLifecycle']) => {
    const now = new Date()
    const startDate = lifecycle.scheduledAt?.start 
      ? new Date(lifecycle.scheduledAt.start) 
      : new Date(lifecycle.startedAt)
    const endDate = new Date(lifecycle.endedAt)
    
    if (now < startDate) {
      setSessionStatus('not_started')
    } else if (now < endDate) {
      setSessionStatus('active')
    } else {
      setSessionStatus('ended')
    }
  }

  // Handle time range change
  const handleTimeRangeChange = (range: "day" | "week" | "month") => {
    setTimeRange(range)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading session data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !session) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "No session data available. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Calculate total votes
  const totalVotes = session.candidates?.reduce((sum, candidate) => sum + (candidate.totalVotes || 0), 0) || 0

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" className="gap-1">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <CalendarDays className="h-4 w-4" />
                Time Range
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem 
                onClick={() => handleTimeRangeChange("day")}
                className={timeRange === "day" ? "bg-accent text-accent-foreground" : ""}
              >
                Last 24 Hours
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleTimeRangeChange("week")}
                className={timeRange === "week" ? "bg-accent text-accent-foreground" : ""}
              >
                Last Week
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleTimeRangeChange("month")}
                className={timeRange === "month" ? "bg-accent text-accent-foreground" : ""}
              >
                Last Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sessionStatus === 'not_started' && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Session Not Started</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This session is scheduled but has not started yet. The data shown below is preliminary and will be updated once the session begins.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <TotalVotesCard totalVotes={sessionStatus === 'not_started' ? 0 : totalVotes} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Participation Rate</CardTitle>
            <CardDescription>
              {sessionStatus === 'not_started' 
                ? "0% of eligible voters" 
                : `${Math.round((totalVotes / (session.totalVoters || 1000)) * 100)}% of eligible voters`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionStatus === 'not_started' ? "0" : totalVotes} / {session.totalVoters || 1000}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Session Status</CardTitle>
            <CardDescription>Current state of voting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold capitalize">
                {sessionStatus === 'not_started' ? 'Scheduled' : sessionStatus}
              </div>
              <div>
                {sessionStatus === 'not_started' && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Not Started
                  </Badge>
                )}
                {sessionStatus === 'active' && (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
                {sessionStatus === 'ended' && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Ended
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <CountdownTimer sessionLifecycle={session.sessionLifecycle} status={session.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-5">
          <CardHeader>
            <CardTitle>Votes Over Time</CardTitle>
            <CardDescription>
              {timeRange === "day" && "Vote distribution over the last 24 hours"}
              {timeRange === "week" && "Vote distribution over the last week"}
              {timeRange === "month" && "Vote distribution over the last month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionStatus === 'not_started' ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-lg font-medium">No voting data available yet</p>
                <p className="text-sm text-muted-foreground">
                  Voting data will be displayed once the session begins
                </p>
              </div>
            ) : (
              <VotesOverTimeChart data={votesOverTime} timeRange={timeRange} />
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
            <CardDescription>
              Percentage breakdown by candidate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionStatus === 'not_started' ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-lg font-medium">No voting data available yet</p>
                <p className="text-sm text-muted-foreground">
                  Vote distribution will be displayed once the session begins
                </p>
              </div>
            ) : (
              <VoteDistributionChart candidates={session.candidates || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            Detailed breakdown of votes by candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionStatus === 'not_started' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-lg font-medium">No voting data available yet</p>
              <p className="text-sm text-muted-foreground">
                Candidate voting data will be displayed once the session begins
              </p>
            </div>
          ) : (
            <CandidatesList candidates={session.candidates || []} timeRange={timeRange} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
