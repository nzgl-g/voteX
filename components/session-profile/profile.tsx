"use client"

import { useState, useEffect } from "react"
import { Session } from "@/services/session-service"

interface ProfileProps {
  session: Session
  onUpdate: (session: Session) => void
}

export default function Profile({ session, onUpdate }: ProfileProps) {
  const [currentSession, setCurrentSession] = useState<Session>(session)
  
  useEffect(() => {
    setCurrentSession(session)
  }, [session])

  return (
    <div className="container py-10">

    </div>
  )
}
