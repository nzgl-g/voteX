"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, UserMinus, Edit, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useTeam } from "./team-context"

// Types for log activity
interface LogActivity {
  id: string
  type: 'member_added' | 'member_removed' | 'task_created' | 'task_completed' | 'task_updated' | 'change_requested'
  user: {
    name: string
    avatar?: string
  }
  target: string
  timestamp: string
}

// Mock log service (replace with actual API implementation)
const fetchActivityLogs = async (sessionId: string): Promise<LogActivity[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // In a real app, you would call your API:
  // return await fetch(`/api/sessions/${sessionId}/logs`).then(res => res.json())
  
  return [
    {
      id: "1",
      type: "member_added",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Alice Jones",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
      id: "2",
      type: "task_completed",
      user: {
        name: "Jane Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Fix login bug",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "3",
      type: "task_created",
      user: {
        name: "Bob Smith",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Update user interface",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    },
    {
      id: "4",
      type: "member_removed",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Mike Wilson",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "5",
      type: "task_updated",
      user: {
        name: "Alice Jones",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Prepare presentation",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
    {
      id: "6",
      type: "change_requested",
      user: {
        name: "Mike Brown",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      target: "Team settings",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    },
  ]
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

  // Load logs on mount and when refreshCounter changes
  useEffect(() => {
    loadLogs()
  }, [loadLogs, refreshCounter])

  // Handle manual refresh
  const handleRefresh = () => {
    loadLogs(false)
  }

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

  const getActivityText = (log: LogActivity) => {
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
            <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={log.user.avatar} alt={log.user.name} />
                    <AvatarFallback>
                      {log.user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium leading-none">{log.user.name}</p>
                  <p className="text-sm text-muted-foreground">{getActivityText(log)}</p>
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
