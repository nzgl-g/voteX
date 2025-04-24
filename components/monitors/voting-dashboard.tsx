"use client"

import { useState } from "react"
import { CalendarDays, ChevronDown, FileText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import { VotesOverTimeChart } from "./votes-over-time-chart"
import { CandidatesList } from "./candidates-list"
import { VoteDistributionChart } from "./vote-distribution-chart"
import { CountdownTimer } from "./countdown-timer"
import { TotalVotesCard } from "./total-votes-card"

// Mock data - in a real app, this would come from an API
import { mockSession, mockVotesData, generateMockVotesOverTime } from "@/lib/mock"

export default function VotingDashboard() {
  const timeRange = "day"
  const [session, setSession] = useState(mockSession)
  const [votesData, setVotesData] = useState(mockVotesData)
  const [votesOverTime, setVotesOverTime] = useState(generateMockVotesOverTime("day"))

  // Calculate total votes
  const totalVotes = session.candidates?.reduce((sum, candidate) => sum + candidate.totalVotes, 0) || 0

  // Format session end date for countdown
  const sessionEndDate = new Date(session.sessionLifecycle.endedAt)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
          <p className="text-muted-foreground">{session.description}</p>
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
                Session Info
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <div className="px-3 py-2 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{session.type}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Subtype:</span>
                  <span className="font-medium">{session.subtype}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Access:</span>
                  <span className="font-medium">{session.accessLevel}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {new Date(session.sessionLifecycle.startedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <CountdownTimer endDate={sessionEndDate} />
        <TotalVotesCard totalVotes={totalVotes} />
      </div>

      {/* Line chart - full width */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Votes Over Time</CardTitle>
            <CardDescription>Tracking voting activity in real-time</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <VotesOverTimeChart data={votesOverTime} timeRange={timeRange} />
        </CardContent>
      </Card>

      {/* Bottom section - Pie chart and Candidates list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
            <CardDescription>Percentage breakdown by candidate</CardDescription>
          </CardHeader>
          <CardContent>
            <VoteDistributionChart candidates={session.candidates || []} />
          </CardContent>
        </Card>

        {/* Right column - Candidates list */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates Performance</CardTitle>
            <CardDescription>Detailed breakdown of votes by candidate</CardDescription>
          </CardHeader>
          <CardContent>
            <CandidatesList candidates={session.candidates || []} timeRange={timeRange} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
