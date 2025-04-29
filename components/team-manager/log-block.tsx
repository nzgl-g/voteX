"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { ScrollArea } from "@/components/shadcn-ui/scroll-area"
import { UserPlus, UserMinus, ClipboardList } from "lucide-react"

// Mock data for activity logs
const activityLogs = [
  {
    id: 1,
    type: "member_added",
    description: "Jane Doe added Bob Smith to the team",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "task_assigned",
    description: "John Doe assigned a task to Jane Doe",
    timestamp: "Yesterday",
  },
  {
    id: 3,
    type: "member_removed",
    description: "John Doe removed Alex Johnson from the team",
    timestamp: "2 days ago",
  },
  {
    id: 4,
    type: "task_assigned",
    description: "Jane Doe assigned a task to Bob Smith",
    timestamp: "3 days ago",
  },
  {
    id: 5,
    type: "member_added",
    description: "John Doe added Jane Doe to the team",
    timestamp: "1 week ago",
  },
]

export function LogBlock() {
  const getIconForLogType = (type: string) => {
    switch (type) {
      case "member_added":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "member_removed":
        return <UserMinus className="h-4 w-4 text-red-500" />
      case "task_assigned":
        return <ClipboardList className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent activities in your team</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-4 border-b">
                <div className="mt-0.5">{getIconForLogType(log.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{log.description}</p>
                  <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
