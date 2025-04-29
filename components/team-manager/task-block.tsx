"use client"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Badge } from "@/components/shadcn-ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar"
import { PlusCircle, Calendar } from "lucide-react"

interface TaskBlockProps {
  onAddTask: () => void
}

// Mock data for tasks
const tasks = [
  {
    id: "1",
    title: "Update user interface",
    description: "Implement the new design for the dashboard",
    color: "#4f46e5",
    dueDate: "2023-06-15",
    priority: "high",
    assignedTo: [
      {
        id: "1",
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        id: "3",
        name: "Bob Smith",
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "2",
    title: "Fix login bug",
    description: "Resolve the issue with login authentication",
    color: "#10b981",
    dueDate: "2023-06-10",
    priority: "medium",
    assignedTo: [
      {
        id: "2",
        name: "Jane Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
  {
    id: "3",
    title: "Prepare presentation",
    description: "Create slides for the client meeting",
    color: "#f59e0b",
    dueDate: "2023-06-20",
    priority: "low",
    assignedTo: [
      {
        id: "1",
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        id: "4",
        name: "Alice Jones",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      {
        id: "5",
        name: "Mike Brown",
        avatar: "/placeholder.svg?height=32&width=32",
      },
    ],
  },
]

export default function TaskBlock({ onAddTask }: TaskBlockProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tasks</h3>
        <Button onClick={onAddTask}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: task.color }}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge
                  variant={
                    task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "outline"
                  }
                >
                  {task.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{task.description}</p>

              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Assigned to:</p>
                <div className="flex -space-x-2">
                  {task.assignedTo.map((member) => (
                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
