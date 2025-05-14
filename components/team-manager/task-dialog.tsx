"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, set } from "date-fns"
import { CalendarIcon, Clock, Loader2, CheckCircle2 } from "lucide-react"
import { teamService } from "@/services/team-service"
import { taskService, Task } from "@/services/task-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam, ExtendedTeamMember } from "./team-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Predefined productive colors
const TASK_COLORS = [
  { name: "Blue", value: "#2563eb", bg: "bg-blue-100" },
  { name: "Purple", value: "#7c3aed", bg: "bg-purple-100" },
  { name: "Pink", value: "#db2777", bg: "bg-pink-100" },
  { name: "Red", value: "#dc2626", bg: "bg-red-100" },
  { name: "Orange", value: "#ea580c", bg: "bg-orange-100" },
  { name: "Amber", value: "#d97706", bg: "bg-amber-100" },
  { name: "Green", value: "#16a34a", bg: "bg-green-100" },
  { name: "Teal", value: "#0d9488", bg: "bg-teal-100" },
  { name: "Cyan", value: "#0891b2", bg: "bg-cyan-100" },
  { name: "Indigo", value: "#4f46e5", bg: "bg-indigo-100" },
]

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task
}

export default function TaskDialog({ isOpen, onClose, taskToEdit }: TaskDialogProps) {
  const { sessionId, teamMembers, selectedMembers, fetchTasks } = useTeam()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(TASK_COLORS[9].value) // Default to Indigo
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<{ hours: string; minutes: string }>({ hours: "12", minutes: "00" })
  const [assignedMembers, setAssignedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!taskToEdit

  useEffect(() => {
    if (isOpen) {
      // If in edit mode, populate form with task data
      if (taskToEdit) {
        setTitle(taskToEdit.title)
        setDescription(taskToEdit.description || "")
        setColor(taskToEdit.color || TASK_COLORS[9].value)
        setPriority(taskToEdit.priority)
        
        // Set date and time if dueDate exists
        if (taskToEdit.dueDate) {
          const dueDate = new Date(taskToEdit.dueDate)
          setDate(dueDate)
          setTime({
            hours: dueDate.getHours().toString().padStart(2, '0'),
            minutes: dueDate.getMinutes().toString().padStart(2, '0')
          })
        } else {
          setDate(undefined)
          setTime({ hours: "12", minutes: "00" })
        }
        
        // Set assigned members
        setAssignedMembers(taskToEdit.assignedMembers)
      } else {
        // Reset form for create mode
        resetForm()
        setAssignedMembers(selectedMembers)
      }
    }
    
    // Clean up when dialog closes
    return () => {
      if (!isOpen) {
        resetForm()
      }
    }
  }, [isOpen, taskToEdit, selectedMembers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one member is selected
    if (assignedMembers.length === 0) {
      toast.error("Member Required", {
        description: "Please select at least one team member to assign this task to.",
      });
      return;
    }
    
    // Validate that we have a session ID
    if (!sessionId) {
      toast.error("Session Error", {
        description: "No session ID found. Please try again or contact support.",
      });
      return;
    }
    
    setIsLoading(true)
    
    // Combine date with time
    let dueDateTime = date ? new Date(date) : undefined
    if (dueDateTime && time.hours && time.minutes) {
      dueDateTime = set(dueDateTime, {
        hours: parseInt(time.hours, 10),
        minutes: parseInt(time.minutes, 10),
        seconds: 0
      })
    }
    
    const taskData = {
      title,
      description,
      color,
      priority,
      dueDate: dueDateTime?.toISOString(),
      assignedMembers
    }
    
    if (isEditMode && taskToEdit) {
      // Update existing task
      taskService.updateTask(taskToEdit._id, taskData)
        .then(() => {
          toast.success("Task Updated", {
            description: "The task has been updated successfully."
          })
          fetchTasks() // Refresh tasks after updating
          onClose()
        })
        .catch((error) => {
          console.error("Failed to update task:", error)
          toast.error("Update Failed", {
            description: error.message || "Failed to update the task. Please try again.",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      // Create new task
      taskService.createTask({
        ...taskData,
        session: sessionId
      })
        .then(() => {
          toast.success("Task Created", {
            description: "The task has been created and assigned to the selected members."
          })
          fetchTasks() // Refresh tasks after creating
          onClose()
        })
        .catch((error) => {
          console.error("Failed to create task:", error)
          toast.error("Creation Failed", {
            description: error.message || "Failed to create the task. Please try again.",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setColor(TASK_COLORS[9].value)
    setPriority("medium")
    setDate(new Date())
    setTime({ hours: "12", minutes: "00" })
    setAssignedMembers([])
  }

  const handleRemoveMember = (memberId: string) => {
    setAssignedMembers(assignedMembers.filter(id => id !== memberId))
  }

  const handleAddMember = (memberId: string) => {
    if (!assignedMembers.includes(memberId)) {
      setAssignedMembers([...assignedMembers, memberId])
    }
  }

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    let newValue = value.replace(/\D/g, '')
    
    if (field === 'hours') {
      const hours = parseInt(newValue, 10)
      newValue = hours > 23 ? '23' : hours < 0 ? '00' : newValue.padStart(2, '0')
    } else {
      const minutes = parseInt(newValue, 10)
      newValue = minutes > 59 ? '59' : minutes < 0 ? '00' : newValue.padStart(2, '0')
    }
    
    setTime({
      ...time,
      [field]: newValue
    })
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300) // Reset after animation completes
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Assign New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Make changes to the existing task and save when you're done."
              : "Create a new task and assign it to team members."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done"
              rows={3}
            />
          </div>
          
          {/* Task Priority & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {TASK_COLORS.slice(0, 10).map((taskColor) => (
                  <Button
                    key={taskColor.value}
                    type="button"
                    variant="outline"
                    className={`h-8 w-full p-0 border-2 ${color === taskColor.value ? "ring-2 ring-offset-1" : ""}`}
                    style={{ backgroundColor: taskColor.value, borderColor: taskColor.value }}
                    onClick={() => setColor(taskColor.value)}
                  >
                    <span className="sr-only">{taskColor.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Due Date & Time */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Due Date & Time (Optional)</Label>
              {date && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setDate(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {date && (
                <div className="flex items-center gap-1 w-40">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-12 text-center"
                    value={time.hours}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    maxLength={2}
                  />
                  <span className="text-muted-foreground">:</span>
                  <Input
                    className="w-12 text-center"
                    value={time.minutes}
                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                    maxLength={2}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Assigned Members */}
          <div className="space-y-2">
            <Label>Assigned Team Members</Label>
            
            {/* Assigned members list */}
            <div className="flex flex-wrap gap-2 mb-3">
              {assignedMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned yet</p>
              ) : (
                assignedMembers.map(memberId => {
                  const member = teamMembers.find(m => m._id === memberId)
                  if (!member) return null
                  
                  return (
                    <Badge key={member._id} variant="secondary" className="gap-1">
                      {member.fullName || member.username}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3.5 w-3.5 ml-1 rounded-full"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        <span className="sr-only">Remove {member.username}</span>
                        ×
                      </Button>
                    </Badge>
                  )
                })
              )}
            </div>
            
            {/* Member selection */}
            <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
              {teamMembers.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  No team members available
                </div>
              ) : (
                teamMembers.map(member => (
                  <div key={member._id} className="p-2 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar} alt={member.username} />
                        <AvatarFallback>
                          {member.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.fullName || member.username}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      size="sm"
                      variant={assignedMembers.includes(member._id) ? "default" : "outline"}
                      className="h-7 gap-1"
                      onClick={() => {
                        if (assignedMembers.includes(member._id)) {
                          handleRemoveMember(member._id)
                        } else {
                          handleAddMember(member._id)
                        }
                      }}
                    >
                      {assignedMembers.includes(member._id) ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="text-xs">Assigned</span>
                        </>
                      ) : (
                        <span className="text-xs">Assign</span>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update Task" : "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
