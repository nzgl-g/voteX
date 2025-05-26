"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TeamProvider } from "@/components/team-manager/team-context"
import { TeamMemberTaskBlock } from "@/components/team-member"
import LogBlock from "@/components/team-manager/log-block"

function TeamMemberContent() {
  return (
    <div className="space-y-6">
      <Card className="team-card">
        <CardHeader className="team-card-header flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Team Tasks</CardTitle>
            <CardDescription>View and manage tasks assigned to you and your team.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="team-card-content">
          <TeamMemberTaskBlock />
        </CardContent>
      </Card>

      <Card className="team-card">
        <CardHeader className="team-card-header flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Team Activity</CardTitle>
            <CardDescription>Recent activity from your team.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="team-card-content">
          <LogBlock />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TeamMemberPage() {
  const params = useParams()
  const teamId = params.id as string
  
  return (
    <>
      <SiteHeader title="Team Management" />
      <main className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <TeamProvider sessionId={teamId}>
            <TeamMemberContent />
          </TeamProvider>
        </div>
      </main>
    </>
  )
} 