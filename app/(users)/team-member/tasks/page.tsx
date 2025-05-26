"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Task, taskService } from "@/services/task-service"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow, isAfter } from "date-fns"
import { CheckCircle2, Clock, Calendar, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeamMemberTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<"all" | "pending" | "completed">("all")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true)
      try {
        const assignedTasks = await taskService.getAssignedTasks()
        setTasks(assignedTasks)
        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch assigned tasks:", err)
        setError(err.message || "Failed to load your assigned tasks")
        toast.error("Error loading tasks", {
          description: err.message || "Failed to load your assigned tasks",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const filteredTasks = tasks.filter(task => {
    if (taskStatus === "all") return true
    if (taskStatus === "pending") return task.status === "pending"
    if (taskStatus === "completed") return task.status === "completed"
    return true
  })

  const handleToggleStatus = async (taskId: string) => {
    if (updating) return
    
    setUpdating(taskId)
    
    try {
      const updatedTask = await taskService.toggleTaskCompletion(taskId)
      
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ))
      
      toast.success(
        updatedTask.status === "completed" ? "Task completed" : "Task reopened",
        { description: "Task status has been updated." }
      )
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error)
      toast.error("Error", {
        description: error.message || "Failed to update task status. Please try again.",
      })
    } finally {
      setUpdating(null)
    }
  }

  const isPastDue = (dueDate: string | undefined) => {
    if (!dueDate) return false
    return isAfter(new Date(), new Date(dueDate))
  }

  const getTimeUntilDue = (dueDate: string | undefined) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    return formatDistanceToNow(date, { addSuffix: true })
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500 bg-red-50"
      case "medium": return "text-amber-500 bg-amber-50"
      case "low": return "text-green-500 bg-green-50"
      default: return "text-muted-foreground"
    }
  }

  return (
    <>
      <SiteHeader title="My Tasks" />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Assigned Tasks</h1>
          <p className="text-muted-foreground">
            View and manage all tasks assigned to you across different sessions.
          </p>
        </div>

        <Tabs value={taskStatus} onValueChange={(value) => setTaskStatus(value as "all" | "pending" | "completed")}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            {renderTaskList(filteredTasks)}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-0">
            {renderTaskList(filteredTasks)}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {renderTaskList(filteredTasks)}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )

  function renderTaskList(tasksToRender: Task[]) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">Error loading tasks</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (tasksToRender.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-4">
              {taskStatus === "all" 
                ? "You don't have any tasks assigned to you yet." 
                : taskStatus === "pending" 
                ? "You don't have any pending tasks."
                : "You don't have any completed tasks."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasksToRender.map(task => (
          <Card key={task._id} className={task.status === "completed" ? "bg-muted/30" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>
                    Session: {task.sessionId || task.session}
                  </CardDescription>
                </div>
                <Badge className={`${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
              )}
              
              {task.dueDate && (
                <div className="flex items-center text-sm mb-1">
                  <Clock className="mr-1 h-4 w-4" />
                  <span className={isPastDue(task.dueDate) && task.status !== "completed" ? "text-red-500" : ""}>
                    Due {getTimeUntilDue(task.dueDate)}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant={task.status === "completed" ? "outline" : "default"}
                size="sm"
                onClick={() => handleToggleStatus(task._id)}
                disabled={updating === task._id}
              >
                {updating === task._id ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : task.status === "completed" ? (
                  <>
                    <Clock className="mr-1 h-4 w-4" />
                    Mark as Pending
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
              
              <Link href={`/team-member/session/${task.session}`} passHref>
                <Button variant="ghost" size="sm">
                  View Session
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
} 