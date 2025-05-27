"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, UserMinus, Edit, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useTeam } from "./team-context"
import baseApi from "@/services/base-api"

// Types for log activity
interface LogActivity {
  _id: string
  action: string
  timestamp: string
  actor: {
    _id: string
    fullName: string
    username: string
    email: string
    profilePic?: string
  }
}

// Real API implementation to fetch activity logs
const fetchActivityLogs = async (sessionId: string): Promise<LogActivity[]> => {
  try {
    const response = await baseApi.get(`/activityLogs/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    throw error;
  }
}

export default function LogBlock() {
  const { sessionId, refreshCounter } = useTeam()
  const [activityLogs, setActivityLogs] = useState<LogActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to load logs
  const loadLogs = useCallback(async (showLoadingState = true) => {
    if (!sessionId) return
    
    if (showLoadingState) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    
    try {
      const logs = await fetchActivityLogs(sessionId)
      setActivityLogs(logs)
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
      if (showLoadingState) {
        toast.error("Error loading logs", {
          description: "Failed to load activity logs. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [sessionId])

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    loadLogs()
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      loadLogs(false) // Don't show loading state on auto-refresh
    }, 30000) // 30 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [loadLogs, refreshCounter])

  // Handle manual refresh
  const handleRefresh = () => {
    loadLogs(false)
  }

  const getActivityIcon = (action: string) => {
    if (action.includes("added") || action.includes("joined")) {
      return <UserPlus className="h-5 w-5 text-green-500" />
    } else if (action.includes("removed") || action.includes("left")) {
      return <UserMinus className="h-5 w-5 text-red-500" />
    } else if (action.includes("created")) {
      return <Clock className="h-5 w-5 text-blue-500" />
    } else if (action.includes("completed")) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (action.includes("updated") || action.includes("changed")) {
      return <Edit className="h-5 w-5 text-yellow-500" />
    } else if (action.includes("requested")) {
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    } else {
      return <Edit className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "some time ago"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium">Activity Log</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted"></div>
                  <div className="h-3 w-1/3 rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No activity logs available
          </div>
        ) : (
          activityLogs.map((log) => (
            <div key={log._id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {getActivityIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={log.actor.profilePic} alt={log.actor.fullName} />
                    <AvatarFallback>
                      {log.actor.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium leading-none">{log.actor.fullName}</p>
                  <p className="text-sm text-muted-foreground">{log.action}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(log.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
