"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, Calendar, CheckCircle, Circle, Clock, Loader2 } from "lucide-react"
import { Task, taskService } from "@/api/task-service"
import { toast } from "@/components/ui/use-toast"
import { useParams } from "next/navigation"
import { format, isAfter } from "date-fns"

interface TaskBlockProps {
  onAddTask: () => void
}

interface TeamMember {
  _id: string
  username: string
  email: string
  fullName?: string
  avatar?: string
}

export default function TaskBlock({ onAddTask }: TaskBlockProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const params = useParams()
  const sessionId = params.id as string

  // Fetch tasks for the current session
  useEffect(() => {
    if (sessionId) {
      fetchTasks()
    }
  }, [sessionId])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const tasksData = await taskService.getSessionTasks(sessionId)
      setTasks(tasksData)
      
      // Collect all unique member IDs to fetch their info
      const memberIds = new Set<string>()
      tasksData.forEach(task => {
        task.assignedMembers.forEach(memberId => {
          memberIds.add(memberId)
        })
      })
      
      // TO-DO: Fetch member details for all IDs in memberIds
      // For now, we'll use placeholder data
      const membersMap: Record<string, TeamMember> = {}
      memberIds.forEach(id => {
        membersMap[id] = {
          _id: id,
          username: `user_${id.substring(0, 4)}`,
          email: `user_${id.substring(0, 4)}@example.com`,
          fullName: `User ${id.substring(0, 4)}`,
        }
      })
      
      setTeamMembers(membersMap)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    setUpdating(taskId)
    try {
      const updatedTask = await taskService.toggleTaskCompletion(taskId)
      
      // Update the tasks array with the new task data
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ))
      
      toast({
        title: updatedTask.status === "completed" ? "Task completed" : "Task reopened",
        description: updatedTask.status === "completed" 
          ? `You've marked "${updatedTask.title}" as complete.` 
          : `You've reopened "${updatedTask.title}".`,
      })
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error)
      
      // Show the specific error message if available
      const errorMessage = error.message || "Failed to update task status. Please try again."
      const isAuthError = errorMessage.includes("not authorized") || errorMessage.includes("unauthorized")
      
      toast({
        title: isAuthError ? "Permission Denied" : "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      // If there was an auth error, refresh the task list to ensure we have current data
      if (isAuthError) {
        fetchTasks()
      }
    } finally {
      setUpdating(null)
    }
  }

  const isPastDue = (dueDate: string | undefined) => {
    if (!dueDate) return false
    return isAfter(new Date(), new Date(dueDate))
  }

  const getAssignedNames = (memberIds: string[]) => {
    return memberIds.map(id => teamMembers[id]?.fullName || teamMembers[id]?.username || 'Unknown user').join(', ')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tasks</h3>
        <Button onClick={onAddTask}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first task to begin assigning work to your team.
          </p>
          <Button className="mt-4" onClick={onAddTask}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card 
              key={task._id} 
              className={`overflow-hidden transition-opacity ${task.status === "completed" ? 'opacity-75' : ''}`}
            >
              <div className="h-2" style={{ backgroundColor: task.color }}></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    <div 
                      className="mr-2 cursor-pointer flex-shrink-0"
                      onClick={() => handleToggleComplete(task._id)}
                    >
                      {updating === task._id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : task.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className={task.status === "completed" ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </CardTitle>
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

                {task.dueDate && (
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4" />
                    <span className={isPastDue(task.dueDate) && task.status !== "completed" ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                      Due: {format(new Date(task.dueDate), 'PPP')}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Assigned to:</p>
                  <div className="flex -space-x-2 overflow-hidden">
                    {task.assignedMembers.map((memberId) => (
                      <Avatar key={memberId} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={teamMembers[memberId]?.avatar || `/api/avatar?name=${teamMembers[memberId]?.username || 'U'}`} alt={teamMembers[memberId]?.fullName || 'Team member'} />
                        <AvatarFallback>
                          {(teamMembers[memberId]?.fullName || teamMembers[memberId]?.username || 'U')
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {task.status === "completed" && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <span>Completed by {teamMembers[task.assignedMembers[0]]?.fullName || teamMembers[task.assignedMembers[0]]?.username || 'a team member'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
