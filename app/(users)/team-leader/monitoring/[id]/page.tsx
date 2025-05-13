"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import VotingDashboard from "@/components/monitoring/voting-dashboard"
import { DashboardSkeleton } from "@/components/monitoring/dashboard-skeleton"
import { SiteHeader } from "@/components/sidebar/site-header"

export default function MonitoringPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <>
      <SiteHeader title="Monitoring Dashboard" />
      <div className="min-h-screen bg-background">
        <Suspense fallback={<DashboardSkeleton/>}>
          <VotingDashboard sessionId={sessionId} />
        </Suspense>
      </div>
    </>
  )
}
