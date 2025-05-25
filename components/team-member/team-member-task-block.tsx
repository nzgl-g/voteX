"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { 
  PlusCircle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Circle,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  SlidersHorizontal,
  Check,
  Edit,
} from "lucide-react"
import { taskService, Task } from "@/services/task-service"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useTeam } from "../team-manager/team-context"

export function TeamMemberTaskBlock() {
  const { teamMembers, tasks, fetchTasks, refreshCounter } = useTeam()
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "recent">("dueDate")
  
  // Apply filters and sorting to tasks
  useEffect(() => {
    setIsLoading(true)
    
    // Filter tasks
    let result = [...tasks]
    
    if (filter === "pending") {
      result = result.filter(task => task.status !== "completed")
    } else if (filter === "completed") {
      result = result.filter(task => task.status === "completed")
    }
    
    // Sort tasks
    result.sort((a, b) => {
      if (sortBy === "dueDate") {
        // If both have due dates, compare them
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        // If only one has a due date, prioritize the one with a due date
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return 0
      } else if (sortBy === "priority") {
        // Convert priority to numeric value for comparison
        const priorityValue: Record<string, number> = { high: 0, medium: 1, low: 2 }
        return priorityValue[a.priority] - priorityValue[b.priority]
      } else {
        // Sort by creation date (most recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    setFilteredTasks(result)
    setIsLoading(false)
  }, [tasks, filter, sortBy, refreshCounter])

  const handleToggleComplete = async (taskId: string) => {
    if (updating) return; // Prevent multiple simultaneous updates
    
    setUpdating(taskId);
    
    try {
      const updatedTask = await taskService.toggleTaskCompletion(taskId);
      await fetchTasks();
      
      toast.success(
        updatedTask.status === "completed" ? "Task completed" : "Task reopened",
        { description: "Task status has been updated." }
      );
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error);
      fetchTasks();
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

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === "completed").length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  // Helper function to get member initials for avatar
  const getMemberInitials = (memberId: string): string => {
    const member = teamMembers.find(m => m._id === memberId)
    if (!member) return '??'
    
    const username = member.username || ''
    return username.substring(0, 2).toUpperCase()
  }

  // Helper function to get member username
  const getMemberUsername = (memberId: string): string => {
    const member = teamMembers.find(m => m._id === memberId)
    return member?.username || 'Unknown Member'
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
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex -space-x-2">
                  {[1, 2].map(j => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </div>
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
          <p className="text-muted-foreground">
            {tasks.length === 0 ? (
              "No tasks assigned yet."
            ) : (
              <>
                {tasks.length} task{tasks.length !== 1 && "s"} • 
                {getCompletionRate()}% completed
              </>
            )}
          </p>
        </div>
        
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
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
      </div>
      
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-1">No tasks assigned to you</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            You don't have any tasks assigned to you yet.
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-1">No matching tasks</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            No tasks match your current filter. Try changing your filter.
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
                      {task.assignedMembers.slice(0, 3).map(memberId => (
                        <TooltipProvider key={memberId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {getMemberInitials(memberId)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {getMemberUsername(memberId)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {task.assignedMembers.length > 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                                +{task.assignedMembers.length - 3}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {task.assignedMembers.slice(3).map(memberId => (
                                <div key={memberId}>
                                  {getMemberUsername(memberId)}
                                </div>
                              ))}
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
    </div>
  )
} 