"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, UserMinus, Edit, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data for activity logs
const activityLogs = [
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

export default function LogBlock() {
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
        {activityLogs.map((log) => (
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
        ))}
      </CardContent>
    </Card>
  )
}
