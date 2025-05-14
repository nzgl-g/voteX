"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { 
  RefreshCw, 
  Users, 
  Vote, 
  Activity, 
  Clock, 
  AlertCircle, 
  BarChart2, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  InfoIcon,
  Shield,
  TrendingUp,
  Gauge
} from "lucide-react"
import { Component as VotingPieChart } from "./piechart"
import { Component as VotingBarChart } from "./barchart"
import { DashboardSkeleton } from "./dashboard-skeleton"
import sessionService, { Session, Election, Poll } from "@/services/session-service"
import blockchainService from "@/services/blockchain-service"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

// Define chart data type for clarity
interface ChartDataItem {
  name: string
  value: number
  color: string
}

interface VotingDashboardProps {
  sessionId: string
}

export default function VotingDashboard({ sessionId }: VotingDashboardProps) {
  // State management
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voterData, setVoterData] = useState({ 
    totalVoters: 0, 
    votesRegistered: 0,
    blockchainVotes: 0,
    participation: 0 
  })
  
  // Chart theme colors with better contrast
  const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16'  // Lime
  ];

  // Fetch session data on component mount
  useEffect(() => {
    fetchSessionData()
    
    // Auto refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchSessionData(false)
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [sessionId])

  // Countdown timer effect
  useEffect(() => {
    if (!session || !session.sessionLifecycle) return
    
    // Calculate end time
    let endTime: Date | null = null
    
    if (session.sessionLifecycle.endedAt) {
      endTime = new Date(session.sessionLifecycle.endedAt)
    } else if (session.sessionLifecycle.scheduledAt?.end) {
      endTime = new Date(session.sessionLifecycle.scheduledAt.end)
    }
    
    if (!endTime) return
    
    // Set up timer
    const timer = setInterval(() => {
      const now = new Date()
      const difference = endTime!.getTime() - now.getTime()
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
        return
      }
      
      // Calculate remaining time
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      
      setTimeLeft({ days, hours, minutes, seconds })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [session])

  // Fetch and process session data
  const fetchSessionData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    
    try {
      const sessionData = await sessionService.getSessionById(sessionId)
      setSession(sessionData)
      
      // Process data for charts and calculate metrics
      processChartData(sessionData)
      calculateVoterMetrics(sessionData)
      
      setError(null)
    } catch (err: any) {
      console.error("Error fetching session data:", err)
      setError(err.message || "Failed to load session data")
      toast({
        title: "Error",
        description: err.message || "Failed to load session data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Process session data for charts
  const processChartData = (sessionData: Session) => {
    if (!sessionData) return
    
    let data: ChartDataItem[] = []
    
    if (sessionData.type === "election" && (sessionData as Election).candidates) {
      const candidates = (sessionData as Election).candidates || []
      
      data = candidates.map((candidate, index) => ({
        name: candidate.fullName || `Candidate ${index + 1}`,
        value: candidate.totalVotes || 0,
        color: COLORS[index % COLORS.length]
      }))
    } else if (sessionData.type === "poll" && (sessionData as Poll).options) {
      const options = (sessionData as Poll).options || []
      
      data = options.map((option, index) => ({
        name: option.name || `Option ${index + 1}`,
        value: option.totalVotes || 0,
        color: COLORS[index % COLORS.length]
      }))
    }
    
    setChartData(data)
  }

  // Calculate voter metrics
  const calculateVoterMetrics = (sessionData: Session) => {
    if (!sessionData) return
    
    const totalVotes = chartData.reduce((acc, item) => acc + item.value, 0)
    const blockchainVotes = sessionData.results?.blockchainVoterCount || 0
    
    // Calculate a reasonable default for totalVoters if not explicitly provided
    let totalRegisteredVoters = 1000 // Default fallback value
    
    // Try to get participant count from stored participants if available
    if (sessionData.participants && Array.isArray(sessionData.participants)) {
      totalRegisteredVoters = sessionData.participants.length
    }
    
    setVoterData({
      totalVoters: totalRegisteredVoters,
      votesRegistered: totalVotes,
      blockchainVotes: blockchainVotes,
      participation: totalRegisteredVoters > 0 ? Math.round((totalVotes / totalRegisteredVoters) * 100) : 0
    })
  }

  // Handle manual refresh
  const handleRefreshData = () => {
    fetchSessionData(false)
  }

  // Handle manual blockchain sync
  const handleManualSync = async () => {
    if (!session || !session._id || !session.contractAddress) return
    
    try {
      setRefreshing(true)
      toast({
        title: "Syncing...",
        description: "Syncing blockchain data. Please wait."
      })
      
      await blockchainService.syncBlockchainResults(session._id, session.contractAddress)
      await fetchSessionData(false)
      
      toast({
        title: "Sync Complete",
        description: "Blockchain data has been synced successfully."
      })
    } catch (error: any) {
      console.error("Sync error:", error)
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync blockchain data",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Get status badge based on session state
  const getStatusBadge = () => {
    if (session?.sessionLifecycle?.endedAt) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ended
        </Badge>
      )
    } else if (session?.contractAddress) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
          <Activity className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  // Loading state
  if (loading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Error Loading Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error || "Failed to load session data"}</p>
            <Button onClick={() => fetchSessionData()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header with session info and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{session.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground text-sm">
            {session.type} · {session.subtype} · {session.organizationName || "No organization"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          
          {session.contractAddress && (
            <Button
              variant="default"
              size="sm"
              onClick={handleManualSync}
              disabled={refreshing}
              className="h-9"
            >
              <Activity className="h-4 w-4 mr-2" />
              Sync Blockchain
            </Button>
          )}
        </div>
      </div>

      {/* Status summary banner */}
      <Card className="overflow-hidden border-none bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-800 dark:text-blue-400">Voting Status</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">Status</p>
                  <p className="text-xl font-semibold">
                    {session.sessionLifecycle?.endedAt ? "Ended" : 
                      session.contractAddress ? "Active" : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">Participation</p>
                  <p className="text-xl font-semibold">{voterData.participation}%</p>
                </div>
              </div>
              
              <div className="pt-1">
                <Progress value={voterData.participation} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{voterData.votesRegistered} votes cast</span>
                  <span>of {voterData.totalVoters} eligible voters</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-800 dark:text-blue-400">Timing</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">Started</p>
                  <p className="text-sm">{formatDate(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-1">
                    {session.sessionLifecycle?.endedAt ? "Ended" : "Ending"}
                  </p>
                  <p className="text-sm">{formatDate(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end)}</p>
                </div>
              </div>
              
              {timeLeft && !session.sessionLifecycle?.endedAt && (
                <div className="bg-white dark:bg-slate-800 rounded-md p-3 flex justify-between text-center">
                  <div>
                    <p className="text-xl font-bold">{timeLeft.days}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{timeLeft.hours}</p>
                    <p className="text-xs text-muted-foreground">hours</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{timeLeft.minutes}</p>
                    <p className="text-xs text-muted-foreground">minutes</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{timeLeft.seconds}</p>
                    <p className="text-xs text-muted-foreground">seconds</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Votes & Participants Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{voterData.votesRegistered}</p>
                <p className="text-sm text-muted-foreground">Votes Cast</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{voterData.totalVoters}</p>
                <p className="text-sm text-muted-foreground">Eligible Voters</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Participation Rate</span>
                  <span className="font-medium">{voterData.participation}%</span>
                </div>
                <Progress value={voterData.participation} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Results Summary Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-violet-500" />
              Results Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[calc(100%-60px)]">
            {chartData.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-[120px]">
                  <VotingPieChart 
                    data={chartData}
                    height={300}
                    showCenterLabel={true}
                    centerLabelText="Votes"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Full Results
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">No votes have been cast yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Blockchain Status Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Blockchain 
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {session.contractAddress ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-md p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {voterData.blockchainVotes}
                  </p>
                  <p className="text-sm text-muted-foreground">Votes on Blockchain</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Contract Address</p>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-hidden">
                    <p className="text-xs font-mono truncate">{session.contractAddress}</p>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-4 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-3 mb-3">
                  <ExternalLink className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium">Not Deployed</p>
                <p className="text-xs text-muted-foreground mt-1">No blockchain integration</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main tabs section */}
      <Tabs defaultValue="results" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1">
              <InfoIcon className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="voters" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Voters
            </TabsTrigger>
          </TabsList>

          {/* Time filters could go here in the future */}
        </div>
        
        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Results Visualization</CardTitle>
                {chartData.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Real-time
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Chart section */}
                <div className="p-6 flex items-center justify-center">
                  {chartData.length > 0 ? (
                    <div className="w-full max-w-sm mx-auto">
                      <VotingPieChart 
                        data={chartData}
                        height={300}
                        showCenterLabel={true}
                        centerLabelText="Votes"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
                        <Vote className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-medium">No Votes Cast</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Votes will appear here once participants start casting their votes.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Results table */}
                <div className="border-t lg:border-t-0 lg:border-l">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {session.type === "election" ? "Candidate Results" : "Poll Options Results"}
                    </h3>
                    {chartData.length > 0 ? (
                      <div className="space-y-4">
                        {chartData.map((item, index) => {
                          const totalVotes = chartData.reduce((sum, item) => sum + item.value, 0)
                          const percentage = totalVotes > 0 
                            ? ((item.value / totalVotes) * 100).toFixed(1) 
                            : "0.0"
                            
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-3 w-3 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="font-medium">{item.name}</span>
                                </div>
                                <div className="font-bold">{percentage}%</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={parseFloat(percentage)} 
                                  className="h-2" 
                                  indicatorColor={item.color}
                                />
                                <span className="text-sm text-muted-foreground w-16 text-right">
                                  {item.value} votes
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center border rounded-lg bg-slate-50 dark:bg-slate-900">
                        <p className="text-muted-foreground text-sm">No votes recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Vote Distribution Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Vote Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[350px]">
                <VotingBarChart 
                  data={chartData}
                  height={300}
                  valueLabel="Votes"
                  showLabels={true}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <InfoIcon className="h-5 w-5 text-blue-500" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Session Type</p>
                          <p className="capitalize">{session.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subtype</p>
                          <p className="capitalize">{session.subtype}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Organization</p>
                        <p>{session.organizationName || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{session.description || "No description provided"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                        <p>{session.visibility || (session.secretPhrase ? "Private" : "Public")}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Timeline info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Timeline
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created At</p>
                        <p>{formatDate(session.createdAt)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p>{formatDate(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">End Date</p>
                        <p>{formatDate(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end) || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {session.contractAddress && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        Blockchain Details
                      </h3>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
                        <p className="font-mono text-xs break-all">{session.contractAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Voters Tab */}
        <TabsContent value="voters" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Voter Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{voterData.totalVoters}</p>
                  <p className="text-sm text-muted-foreground">Eligible Voters</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg text-center">
                  <Vote className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{voterData.votesRegistered}</p>
                  <p className="text-sm text-muted-foreground">Votes Cast</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg text-center">
                  <BarChart2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{voterData.participation}%</p>
                  <p className="text-sm text-muted-foreground">Participation Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Participation chart */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Participation Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[350px]">
              {chartData.length > 0 ? (
                <VotingBarChart
                  data={[
                    { name: 'Total Voters', value: voterData.totalVoters, fill: '#94a3b8' },
                    { name: 'Votes Cast', value: voterData.votesRegistered, fill: '#3b82f6' },
                    { name: 'Blockchain Votes', value: voterData.blockchainVotes, fill: '#8b5cf6' }
                  ]}
                  height={300}
                  valueLabel="Voters"
                  layout="vertical"
                  showLabels={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No voter data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 