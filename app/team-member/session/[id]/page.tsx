"use client"

import { useParams } from "next/navigation"
import { Suspense } from "react"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { PlayCircle, StopCircle, Trash2, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn-ui/alert"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { VoteSessionManagement } from "@/components/session-profile/vote-session-management"

export default function TeamMemberSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [isLoading, setIsLoading] = useState(false)
  
  // Session control handlers (would connect to your API)
  const handleStartSession = async () => {
    setIsLoading(true)
    try {
      // This would be replaced with your actual API call
      // await yourApi.startSession(sessionId)
      
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Session started",
        description: "The voting session has been started successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start the session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEndSession = async () => {
    setIsLoading(true)
    try {
      // This would be replaced with your actual API call
      // await yourApi.endSession(sessionId)
      
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Session ended",
        description: "The voting session has been ended successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end the session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteSession = async () => {
    setIsLoading(true)
    try {
      // This would be replaced with your actual API call
      // await yourApi.deleteSession(sessionId)
      
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Session deleted",
        description: "The voting session has been deleted successfully.",
      })
      
      // Redirect to default view
      router.push("/team-member/monitoring")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SiteHeader title="Session Management" />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <VoteSessionManagement />
          
          {/* Session Controls */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Session Controls</CardTitle>
              <CardDescription>
                Start, end, or delete this voting session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Changes to session state cannot be undone. Make sure you want to perform these actions.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleStartSession}
                disabled={isLoading}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Session
              </Button>
              <Button 
                variant="default" 
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleEndSession}
                disabled={isLoading}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                End Session
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteSession}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Session
              </Button>
            </CardFooter>
          </Card>
        </Suspense>
      </div>
    </>
  )
} 