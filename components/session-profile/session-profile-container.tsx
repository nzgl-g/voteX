"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { SessionDataProvider, useSessionData } from "./session-data-provider"
import { SessionProfile } from "./session-profile"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn-ui/alert"

// This component will be used inside the SessionDataProvider
function SessionProfileContent() {
  const { session, candidates, teamMembers, loading, error, fetchSession } = useSessionData()
  const params = useParams()
  const sessionId = params?.sessionId as string
  
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId)
    }
  }, [sessionId, fetchSession])
  
  if (loading) {
    return <SessionProfileSkeleton />
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (!session) {
    return (
      <Alert className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Session Selected</AlertTitle>
        <AlertDescription>
          Please select a session from the dropdown menu or create a new one.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <SessionProfile session={session} candidates={candidates} teamMembers={teamMembers} />
}

// Skeleton loader for the session profile
function SessionProfileSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
      {/* Banner skeleton */}
      <div className="mb-8 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
        <Skeleton className="h-48 sm:h-56 md:h-64 w-full" />
        
        {/* Session header info skeleton */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-8 overflow-hidden">
        <div className="p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
        </div>
      </div>
      
      {/* Candidates/Options Section skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full mb-2" />
      </div>
    </div>
  )
}

// Container component that provides the session data context
export default function SessionProfileContainer() {
  return (
    <SessionDataProvider>
      <SessionProfileContent />
    </SessionDataProvider>
  )
}
