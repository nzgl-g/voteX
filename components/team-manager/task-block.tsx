"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { taskService, Task } from "@/services/task-service"
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
import { teamService, TeamMember } from "@/services/team-service"
import { sessionService } from "@/services/session-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import TaskDialog from "./task-dialog"

// Extended TeamMember interface to include avatar property
interface ExtendedTeamMember extends TeamMember {
  avatar?: string;
}

interface TaskBlockProps {
  onAddTask: () => void
}

export default function TaskBlock({ onAddTask }: TaskBlockProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<Record<string, ExtendedTeamMember>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "recent">("dueDate")
  const params = useParams()
  const sessionId = params.id as string
  
  // Edit and delete state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined)
  
  // Auto-refresh reference
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<{ tasks: Task[], members: Record<string, ExtendedTeamMember> }>({ 
    tasks: [], 
    members: {} 
  })

  // Quiet fetch function that doesn't set loading state
  const quietFetchData = useCallback(async () => {
    try {
      // Fetch tasks for the session
      const tasksData = await taskService.getSessionTasks(sessionId)
      
      // Check if tasks have changed
      const tasksChanged = JSON.stringify(tasksData) !== JSON.stringify(lastDataRef.current.tasks)
      
      if (tasksChanged) {
        // Update tasks state
        setTasks(tasksData)
        lastDataRef.current.tasks = tasksData
        
        // Get team ID for the session
        const teamId = await sessionService.getSessionTeam(sessionId)
        
        if (teamId) {
          // Fetch team members data
          const teamData = await teamService.getTeamMembers(teamId)
          
          // Create a map of member IDs to member data
          const membersMap: Record<string, ExtendedTeamMember> = {}
          
          // Add leader
          if (teamData.leader && typeof teamData.leader !== 'string') {
            membersMap[teamData.leader._id] = {
              ...teamData.leader,
              avatar: `/api/avatar?name=${teamData.leader.username}`
            } as ExtendedTeamMember
          }
          
          // Add members
          if (teamData.members && Array.isArray(teamData.members)) {
            teamData.members.forEach(member => {
              if (typeof member !== 'string') {
                membersMap[member._id] = {
                  ...member,
                  avatar: `/api/avatar?name=${member.username}`
                } as ExtendedTeamMember
              }
            })
          }
          
          // Check if members have changed
          const membersChanged = JSON.stringify(membersMap) !== JSON.stringify(lastDataRef.current.members)
          
          if (membersChanged) {
            setTeamMembers(membersMap)
            lastDataRef.current.members = membersMap
          }
        }
      }
    } catch (error) {
      console.error("Auto-refresh failed:", error)
      // Don't show error toast for quiet refresh
    }
  }, [sessionId])

  // Memoize the fetchTasksAndMembers function to prevent unnecessary re-renders
  const fetchTasksAndMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch tasks for the session
      const tasksData = await taskService.getSessionTasks(sessionId)
      setTasks(tasksData)
      lastDataRef.current.tasks = tasksData
      
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
        if (teamData.leader && typeof teamData.leader !== 'string') {
          membersMap[teamData.leader._id] = {
            ...teamData.leader,
            avatar: `/api/avatar?name=${teamData.leader.username}`
          } as ExtendedTeamMember
        }
        
        // Add members
        if (teamData.members && Array.isArray(teamData.members)) {
          teamData.members.forEach(member => {
            if (typeof member !== 'string') {
              membersMap[member._id] = {
                ...member,
                avatar: `/api/avatar?name=${member.username}`
              } as ExtendedTeamMember
            }
          })
        }
        
        setTeamMembers(membersMap)
        lastDataRef.current.members = membersMap
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast.error("Error", {
        description: "Failed to load tasks. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchTasksAndMembers()
      
      // Set up auto-refresh interval
      autoRefreshIntervalRef.current = setInterval(() => {
        quietFetchData()
      }, 15000) // 15 seconds
    }
    
    // Cleanup function
    return () => {
      setTasks([])
      setFilteredTasks([])
      setTeamMembers({})
      setUpdating(null)
      setTaskToEdit(undefined)
      setTaskToDelete(undefined)
      
      // Clear the interval when component unmounts
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [sessionId, fetchTasksAndMembers, quietFetchData])

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

  const handleToggleComplete = async (taskId: string) => {
    setUpdating(taskId)
    try {
      // Call the backend to toggle completion
      const updatedTask = await taskService.toggleTaskCompletion(taskId);
      // Update the task in state with the server response
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === taskId ? updatedTask : task)
      );
      // Show success toast
      if (updatedTask.status === "completed") {
        toast.success("Task completed", {
          description: `You've marked \"${updatedTask.title}\" as complete.`,
        });
      } else {
        toast.success("Task reopened", {
          description: `You've reopened \"${updatedTask.title}\".`,
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error);
      fetchTasksAndMembers();
      toast.error("Error", {
        description: error.message || "Failed to update task status. Please try again.",
      });
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
    if (!taskToDelete) return;

    const taskId = taskToDelete._id;
    const taskTitle = taskToDelete.title;

    // Show loading toast
    const loadingToast = toast.loading("Deleting task...");

    try {
      // Perform the actual delete operation
      await taskService.deleteTask(taskId);

      // Refresh tasks from backend to ensure UI is in sync
      await fetchTasksAndMembers();

      toast.success("Task deleted", {
        description: `Task "${taskTitle}" has been deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      toast.error("Error", {
        description: error.message || "Failed to delete task. Please try again.",
      });
      // Optionally refresh tasks to restore the correct state
      setTimeout(() => {
        fetchTasksAndMembers();
      }, 500);
    } finally {
      toast.dismiss(loadingToast);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(undefined);
    }
  };

  const handleTaskDialogClose = () => {
    // Close the dialog immediately
    setIsEditDialogOpen(false)
    
    // Clear task to edit state
    setTaskToEdit(undefined)
    
    // Show loading toast
    const loadingToast = toast.loading("Refreshing tasks...")
    
    // Refresh tasks after a short delay
    setTimeout(() => {
      fetchTasksAndMembers().then(() => {
        // Dismiss loading toast when done
        toast.dismiss(loadingToast)
      }).catch(() => {
        // Dismiss loading toast on error
        toast.dismiss(loadingToast)
      })
    }, 300)
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
              style={{
                background: task.color
                  ? `${task.color}20` // 12.5% opacity in hex
                  : 'rgba(79,70,229,0.08)', // fallback indigo
                border: `1.5px solid ${task.color || '#4f46e5'}30`,
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s',
              }}
              className={cn(
                'rounded-2xl overflow-hidden hover:shadow-lg group flex flex-col min-h-[220px] p-0',
                task.status === 'completed' ? 'opacity-80' : '',
                isPastDue(task.dueDate) && task.status !== 'completed' ? 'ring-2 ring-red-200' : ''
              )}
            >
              {/* Color accent bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: task.color || '#4f46e5' }} />
              <div className="flex flex-col flex-1 p-5 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full border border-muted-foreground/10 bg-white/60 hover:bg-white"
                      onClick={() => handleToggleComplete(task._id)}
                      disabled={updating === task._id}
                      aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {updating === task._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : task.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 fill-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <span className={cn(
                      'text-lg font-bold',
                      task.status === 'completed' && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[80px]">
                    <Badge
                      variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'outline'
                      }
                      className={cn('capitalize text-xs px-2 py-0.5',
                        task.priority === 'high' && 'bg-red-500/90 text-white',
                        task.priority === 'medium' && 'bg-amber-400/80 text-amber-900',
                        task.priority === 'low' && 'bg-green-400/80 text-green-900')}
                    >
                      {task.priority}
                    </Badge>
                    <span className={cn(
                      'text-xs font-medium',
                      isPastDue(task.dueDate) && task.status !== 'completed'
                        ? 'text-red-500' : 'text-muted-foreground')
                    }>
                      {task.dueDate ? `Due ${getTimeUntilDue(task.dueDate)}` : ''}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                    {task.description}
                  </p>
                )}
                {/* Assigned members */}
                {task.assignedMembers.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex -space-x-2">
                      {task.assignedMembers.slice(0, 3).map(memberId => {
                        const member = teamMembers[memberId]
                        return (
                          <TooltipProvider key={memberId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {member?.username.substring(0, 2).toUpperCase() || '??'}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {member?.username || 'Unknown Member'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                      {task.assignedMembers.length > 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                                +{task.assignedMembers.length - 3}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {task.assignedMembers.slice(3).map(memberId => {
                                const member = teamMembers[memberId]
                                return (
                                  <div key={memberId}>
                                    {member?.username || 'Unknown Member'}
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleComplete(task._id)}>
                          {task.status === 'completed' ? (
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
                {task.status === 'completed' && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-700 font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Completed {task.updatedAt ? format(new Date(task.updatedAt), 'MMM d, yyyy') : format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // If dialog is being closed, reset state
          setTaskToDelete(undefined)
        }
        setIsDeleteDialogOpen(open)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{taskToDelete?.title}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent default to handle deletion ourselves
                e.preventDefault()
                confirmDeleteTask()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

