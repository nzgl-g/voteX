"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, UserMinus, Edit, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParams } from "next/navigation"

// In a real application, you would have a proper API service for logs
// This is a placeholder for demonstration
const fetchActivityLogs = async (sessionId: string) => {
  // In a real app, this would be an API call like:
  // return await api.get(`/sessions/${sessionId}/logs`)
  
  // For now, we'll return mock data
  return [
    {
      id: "1",
      type: "member_added",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Alice Jones",
      timestamp: "2023-06-05T10:30:00",
    },
    {
      id: "2",
      type: "task_completed",
      user: {
        name: "Jane Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Fix login bug",
      timestamp: "2023-06-04T15:45:00",
    },
    {
      id: "3",
      type: "task_created",
      user: {
        name: "Bob Smith",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Update user interface",
      timestamp: "2023-06-03T09:15:00",
    },
    {
      id: "4",
      type: "member_removed",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Mike Wilson",
      timestamp: "2023-06-02T14:20:00",
    },
    {
      id: "5",
      type: "task_updated",
      user: {
        name: "Alice Jones",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Prepare presentation",
      timestamp: "2023-06-01T11:10:00",
    },
    {
      id: "6",
      type: "change_requested",
      user: {
        name: "Mike Brown",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Team settings",
      timestamp: "2023-05-31T16:30:00",
    },
  ]
}

export default function LogBlock() {
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const sessionId = params.id as string
  
  // Auto-refresh reference
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<any[]>([])

  // Function to load logs with loading state
  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const logs = await fetchActivityLogs(sessionId)
      setActivityLogs(logs)
      lastDataRef.current = logs
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Quiet fetch function that doesn't set loading state
  const quietFetchLogs = useCallback(async () => {
    try {
      const logs = await fetchActivityLogs(sessionId)
      
      // Check if data has changed
      const dataChanged = JSON.stringify(logs) !== JSON.stringify(lastDataRef.current)
      
      if (dataChanged) {
        setActivityLogs(logs)
        lastDataRef.current = logs
      }
    } catch (error) {
      console.error("Auto-refresh logs failed:", error)
      // Don't show error for quiet refresh
    }
  }, [sessionId])

  useEffect(() => {
    // Initial load
    loadLogs()
    
    // Set up auto-refresh interval
    autoRefreshIntervalRef.current = setInterval(() => {
      quietFetchLogs()
    }, 15000) // 15 seconds
    
    // Cleanup function
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [loadLogs, quietFetchLogs])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member_added":
        return <UserPlus className="h-5 w-5 text-green-500" />
      case "member_removed":
        return <UserMinus className="h-5 w-5 text-red-500" />
      case "task_created":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "task_completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "task_updated":
        return <Edit className="h-5 w-5 text-yellow-500" />
      case "change_requested":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Edit className="h-5 w-5 text-gray-500" />
    }
  }

  const getActivityText = (log: any) => {
    switch (log.type) {
      case "member_added":
        return `added ${log.target} to the team`
      case "member_removed":
        return `removed ${log.target} from the team`
      case "task_created":
        return `created a new task: ${log.target}`
      case "task_completed":
        return `completed the task: ${log.target}`
      case "task_updated":
        return `updated the task: ${log.target}`
      case "change_requested":
        return `requested changes to ${log.target}`
      default:
        return `performed an action on ${log.target}`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={log.user.avatar || "/placeholder.svg"} alt={log.user.name} />
                    <AvatarFallback>
                      {log.user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{log.user.name}</p>
                  <p className="text-sm text-muted-foreground">{getActivityText(log)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
