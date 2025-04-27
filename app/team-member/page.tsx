"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TeamMemberDefaultPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the monitoring page
    router.push('/team-member/monitoring')
  }, [router])

  return null
}
