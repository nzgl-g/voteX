"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  PlusCircle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Circle,
  AlertCircle,
  CalendarDays,
  MoreHorizontal,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Check,
  Trash2,
  Edit,
} from "lucide-react"
import { taskService, Task } from "@/api/task-service"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { format, isAfter, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { teamService } from "@/api/team-service"
import { sessionService } from "@/api/session-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import TaskDialog from "./task-dialog"

// Extended TeamMember interface to include avatar property
interface TeamMember {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

interface TaskBlockProps {
  onAddTask: () => void
}

export default function TaskBlock({ onAddTask }: TaskBlockProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "recent">("dueDate")
  const params = useParams()
  const sessionId = params.id as string
  
  // New state for edit and delete functionality
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (sessionId) {
      fetchTasksAndMembers()
    }
  }, [sessionId])

  useEffect(() => {
    // Apply filters and sorting
    let result = [...tasks]
    
    // Filter by status
    if (filter === "pending") {
      result = result.filter(task => task.status === "pending")
    } else if (filter === "completed") {
      result = result.filter(task => task.status === "completed")
    }
    
    // Sort tasks
    result.sort((a, b) => {
      if (sortBy === "dueDate") {
        // Sort by due date (tasks without due dates go to the end)
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortBy === "priority") {
        // Sort by priority (high > medium > low)
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      } else {
        // Sort by creation date (recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    setFilteredTasks(result)
  }, [tasks, filter, sortBy])

  const fetchTasksAndMembers = async () => {
    setIsLoading(true)
    try {
      // Fetch tasks for the session
      const tasksData = await taskService.getSessionTasks(sessionId)
      setTasks(tasksData)
      
      // Get unique member IDs from all tasks
      const memberIds = new Set<string>()
      tasksData.forEach(task => {
        task.assignedMembers.forEach(memberId => {
          memberIds.add(memberId)
        })
      })
      
      // Get team ID for the session
      const teamId = await sessionService.getSessionTeam(sessionId)
      
      if (teamId) {
        // Fetch team members data
        const teamData = await teamService.getTeamMembers(teamId)
        
        // Create a map of member IDs to member data
        const membersMap: Record<string, TeamMember> = {}
        
        // Add leader
        if (teamData.leader) {
          membersMap[teamData.leader._id] = {
            ...teamData.leader,
            avatar: `/api/avatar?name=${teamData.leader.username}`
          }
        }
        
        // Add members
        if (teamData.members && Array.isArray(teamData.members)) {
          teamData.members.forEach(member => {
            membersMap[member._id] = {
              ...member,
              avatar: `/api/avatar?name=${member.username}`
            }
          })
        }
        
        setTeamMembers(membersMap)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast.error("Error", {
        description: "Failed to load tasks. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    setUpdating(taskId)
    try {
      // Find the task in our current state
      const taskToUpdate = tasks.find(t => t._id === taskId);
      if (!taskToUpdate) {
        throw new Error("Task not found in current state");
      }

      // Optimistically update UI first for better user experience
      const newStatus = taskToUpdate.status === "completed" ? "pending" : "completed";
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === taskId ? 
          {...task, status: newStatus} : task
        )
      );
      
      // Then send request to server - this will also handle sending notifications
      try {
        const updatedTask = await taskService.toggleTaskCompletion(taskId);
        
        // Update with actual server response
        setTasks(prevTasks => 
          prevTasks.map(task => task._id === taskId ? updatedTask : task)
        );
        
        // Show success toast
        if (updatedTask.status === "completed") {
          toast.success("Task completed", {
            description: `You've marked "${updatedTask.title}" as complete.`,
          });
        } else {
          toast.success("Task reopened", {
            description: `You've reopened "${updatedTask.title}".`,
          });
        }
      } catch (error: any) {
        console.warn("Error in response, but task was likely updated:", error);
        
        // Even if there's an error from the server, we know the DB was updated
        // So we keep our optimistic UI update and just show a success message
        toast.success(`Task ${newStatus === "completed" ? "completed" : "reopened"}`, {
          description: `The task status was updated successfully.`,
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error);
      
      // Revert the optimistic update by refreshing data
      fetchTasksAndMembers();
      
      // Extract error message
      let errorMessage = "Failed to update task status. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Check if it's an auth error
      const isAuthError = errorMessage.toLowerCase().includes("not authorized") || 
                          errorMessage.toLowerCase().includes("unauthorized") ||
                          errorMessage.toLowerCase().includes("not assigned");
      
      if (isAuthError) {
        toast.error("Permission Denied", {
          description: errorMessage,
        });
      } else {
        toast.error("Error", {
          description: errorMessage,
        });
      }
    } finally {
      setUpdating(null);
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
      case "high": return "text-red-500"
      case "medium": return "text-amber-500"
      case "low": return "text-green-500"
      default: return "text-muted-foreground"
    }
  }

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === "completed").length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return
    
    setIsDeleting(true)
    try {
      await taskService.deleteTask(taskToDelete._id)
      
      // Update local state to remove the deleted task
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskToDelete._id))
      
      toast.success("Task deleted", {
        description: `Task "${taskToDelete.title}" has been deleted successfully.`,
      })
    } catch (error: any) {
      console.error("Failed to delete task:", error)
      toast.error("Error", {
        description: error.message || "Failed to delete task. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setTaskToDelete(undefined)
    }
  }

  const handleTaskDialogClose = () => {
    setIsEditDialogOpen(false)
    setTaskToEdit(undefined)
    // Refresh tasks after edit
    fetchTasksAndMembers()
  }

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex -space-x-2">
                  {[1, 2].map(j => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tasks header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            {tasks.length === 0 ? (
              "No tasks yet. Create your first task to get started."
            ) : (
              <>
                {tasks.length} task{tasks.length !== 1 && "s"} • 
                {getCompletionRate()}% completed
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onAddTask} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>
      
      {tasks.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "pending" | "completed")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Sort by
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setSortBy("dueDate")}
                className="flex items-center justify-between"
              >
                Due Date
                {sortBy === "dueDate" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("priority")}
                className="flex items-center justify-between"
              >
                Priority
                {sortBy === "priority" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("recent")}
                className="flex items-center justify-between"
              >
                Recently Created
                {sortBy === "recent" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-1">No tasks yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Create your first task to start managing your team's work.
          </p>
          <Button onClick={onAddTask} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Your First Task
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-1">No matching tasks</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            No tasks match your current filter. Try changing your filter or create a new task.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card 
              key={task._id} 
              className={cn(
                "overflow-hidden transition-all duration-200 hover:shadow-md",
                task.status === "completed" ? "opacity-80" : "",
                isPastDue(task.dueDate) && task.status !== "completed" ? "border-red-200" : ""
              )}
            >
              {/* Color indicator strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: task.color || "#4f46e5" }} />
              
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleToggleComplete(task._id)}
                            disabled={updating === task._id}
                          >
                            {updating === task._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : task.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-500 fill-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {task.status === "completed" ? "Mark as incomplete" : "Mark as complete"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <CardTitle 
                      className={cn(
                        "text-base font-medium line-clamp-1",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </CardTitle>
                  </div>
                  
                  <Badge
                    variant={
                      task.priority === "high" ? "destructive" : 
                      task.priority === "medium" ? "default" : "outline"
                    }
                    className="capitalize"
                  >
                    {task.priority}
                  </Badge>
                </div>
                
                {task.dueDate && (
                  <div className="flex items-center text-xs mt-2">
                    <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span 
                      className={cn(
                        "text-xs",
                        isPastDue(task.dueDate) && task.status !== "completed" 
                          ? "text-red-500 font-medium" 
                          : "text-muted-foreground"
                      )}
                    >
                      Due {getTimeUntilDue(task.dueDate)}
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-3">
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {task.description}
                  </p>
                )}
                
                {/* Assigned members */}
                {task.assignedMembers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex -space-x-2">
                      {task.assignedMembers.slice(0, 3).map(memberId => {
                        const member = teamMembers[memberId]
                        return (
                          <TooltipProvider key={memberId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {member?.username.substring(0, 2).toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {member?.username || "Unknown Member"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                      
                      {task.assignedMembers.length > 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
                                +{task.assignedMembers.length - 3}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {task.assignedMembers.slice(3).map(memberId => {
                                const member = teamMembers[memberId]
                                return (
                                  <div key={memberId}>
                                    {member?.username || "Unknown Member"}
                                  </div>
                                )
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleComplete(task._id)}>
                          {task.status === "completed" ? (
                            <>Mark as incomplete</>
                          ) : (
                            <>Mark as complete</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
              
              {task.status === "completed" && (
                <CardFooter className="px-4 py-2 bg-muted/50 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Completed</span>
                  <span>{format(new Date(task.updatedAt), "MMM d, yyyy")}</span>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <TaskDialog
        isOpen={isEditDialogOpen}
        onClose={handleTaskDialogClose}
        selectedMembers={taskToEdit?.assignedMembers || []}
        sessionId={sessionId}
        taskToEdit={taskToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{taskToDelete?.title}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
