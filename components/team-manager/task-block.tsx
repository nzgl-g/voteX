"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { PlusCircle, Calendar, User } from "lucide-react"
import { Badge } from "@/components/shadcn-ui/badge"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/shadcn-ui/avatar"

interface Task {
  id: string
  title: string
  description: string
  color: string
  startDate: Date
  endDate: Date
  priority: string
  assignees: any[]
}

interface TaskBlockProps {
  tasks: Task[]
  onAddTask: () => void
}

export function TaskBlock({ tasks, onAddTask }: TaskBlockProps) {
  const getPriorityBadge = (priority: string) => {
    const classes = {
      low: "bg-green-100 text-green-800 hover:bg-green-100",
      medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      high: "bg-red-100 text-red-800 hover:bg-red-100",
    }

    return (
      <Badge className={classes[priority as keyof typeof classes]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage tasks for your team</CardDescription>
        </div>
        <Button onClick={onAddTask}>Add Task</Button>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: task.color }}></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg">{task.title}</h3>
                    {getPriorityBadge(task.priority)}
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(task.startDate), "MMM d")} - {format(new Date(task.endDate), "MMM d")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {task.assignees.length} {task.assignees.length === 1 ? "assignee" : "assignees"}
                      </span>
                    </div>
                  </div>

                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {task.assignees.slice(0, 5).map((assignee, index) => (
                        <Avatar key={index} className="border-2 border-background h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {assignee.fullName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 5 && (
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs">
                          +{task.assignees.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg">
            <PlusCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">No tasks created yet</p>
            <Button onClick={onAddTask}>Add Task</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
