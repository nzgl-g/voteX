"use client"

import { useParams } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { SessionDetail } from "@/components/session-detail"

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <>
      <SiteHeader title="Session Management" />
      <main className="min-h-screen bg-background">
        <SessionDetail sessionId={sessionId} />
      </main>
    </>
  )
}
