"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import { RefreshCw, Users, Vote, Activity, Clock, AlertCircle, BarChart2, CheckCircle, ExternalLink } from "lucide-react"
import sessionService, { Session, Election, Poll } from "@/services/session-service"
import blockchainService from "@/services/blockchain-service"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface VotingDashboardProps {
  sessionId: string
}

export default function VotingDashboard({ sessionId }: VotingDashboardProps) {
  // State management
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voterData, setVoterData] = useState({ 
    totalVoters: 0, 
    votesRegistered: 0,
    blockchainVotes: 0,
    participation: 0 
  })
  
  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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

  const processChartData = (sessionData: Session) => {
    if (!sessionData) return
    
    let data: any[] = []
    
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

  const calculateVoterMetrics = (sessionData: Session) => {
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

  const handleRefreshData = () => {
    fetchSessionData(false)
  }

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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Error Loading Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error || "Failed to load session data"}</p>
            <Button onClick={() => fetchSessionData()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with session info and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {session.name}
            {session.sessionLifecycle?.endedAt ? (
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ended
              </span>
            ) : session.contractAddress ? (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </span>
            )}
          </h1>
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
              variant="secondary"
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

      {/* Key metrics dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status card */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {session.sessionLifecycle?.endedAt ? "Ended" : 
                    session.contractAddress ? "Active" : "Pending"}
                </span>
                {timeLeft && !session.sessionLifecycle?.endedAt && (
                  <div className="flex gap-1 mt-1 text-xs text-muted-foreground">
                    <span>{timeLeft.days}d</span>
                    <span>{timeLeft.hours}h</span>
                    <span>{timeLeft.minutes}m</span>
                    <span>{timeLeft.seconds}s</span>
                    <span>remaining</span>
                  </div>
                )}
              </div>
              {session.sessionLifecycle?.endedAt ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <Activity className="h-10 w-10 text-blue-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participation card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{voterData.participation}%</span>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
              <Progress value={voterData.participation} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{voterData.votesRegistered} votes</span>
                <span>{voterData.totalVoters} voters</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes card */}
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{voterData.votesRegistered}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  From {voterData.totalVoters} eligible voters
                </span>
              </div>
              <Vote className="h-10 w-10 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        {/* Blockchain card */}
        <Card className={cn(
          "bg-gradient-to-br shadow-sm",
          session.contractAddress 
            ? "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20" 
            : "from-stone-50 to-stone-100 dark:from-stone-900/20 dark:to-stone-800/20"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blockchain Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                {session.contractAddress ? (
                  <>
                    <span className="text-2xl font-bold">{voterData.blockchainVotes}</span>
                    <span className="text-xs text-muted-foreground mt-1">Votes on blockchain</span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-medium">Not deployed</span>
                    <span className="text-xs text-muted-foreground mt-1">No blockchain integration</span>
                  </>
                )}
              </div>
              <ExternalLink className={cn(
                "h-10 w-10", 
                session.contractAddress ? "text-emerald-500" : "text-stone-500"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
        </TabsList>
        
        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Results Visualization</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Chart section */}
                <div className="h-[350px] p-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={130}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No votes have been cast yet</p>
                    </div>
                  )}
                </div>
                
                {/* Results table */}
                <div className="p-4 border-t md:border-t-0 md:border-l">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 font-medium">{session.type === "election" ? "Candidate" : "Option"}</th>
                          <th className="text-right pb-2 font-medium">Votes</th>
                          <th className="text-right pb-2 font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.length > 0 ? chartData.map((item, index) => {
                          const totalVotes = chartData.reduce((sum, item) => sum + item.value, 0)
                          const percentage = totalVotes > 0 
                            ? ((item.value / totalVotes) * 100).toFixed(1) 
                            : "0.0"
                            
                          return (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="py-2 flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-2 text-right">{item.value}</td>
                              <td className="py-2 text-right font-medium">{percentage}%</td>
                            </tr>
                          )
                        }) : (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-muted-foreground">
                              No votes recorded yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic info */}
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
                
                {/* Timeline info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p>{formatDate(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p>{formatDate(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end) || "Not set"}</p>
                  </div>
                  
                  {session.contractAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
                      <p className="font-mono text-xs">{session.contractAddress}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Session ID</p>
                    <p className="font-mono text-xs">{session._id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Voters Tab */}
        <TabsContent value="voters" className="space-y-4">
          {/* Voter metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Voters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{voterData.totalVoters}</span>
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Registered eligible voters</p>
              </CardContent>
            </Card>
            
            {session.contractAddress && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Blockchain Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{voterData.blockchainVotes}</span>
                    <Vote className="h-10 w-10 text-violet-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Votes recorded on blockchain</p>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Participation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{voterData.participation}%</span>
                  <BarChart2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="mt-2">
                  <Progress value={voterData.participation} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Participation metrics chart */}
          <Card>
            <CardHeader>
              <CardTitle>Voter Participation</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Total Voters', value: voterData.totalVoters, fill: '#94a3b8' },
                      { name: 'Votes Cast', value: voterData.votesRegistered, fill: '#3b82f6' },
                      { name: 'Blockchain Votes', value: voterData.blockchainVotes, fill: '#8b5cf6' }
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
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