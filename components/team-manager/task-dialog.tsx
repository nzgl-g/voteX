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
import { teamService, TeamMember as ApiTeamMember } from "@/services/team-service"
import { sessionService } from "@/services/session-service"
import { taskService, Task } from "@/services/task-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface TeamMember {
  _id: string
  username: string
  email: string
  fullName?: string
  role?: string
  status?: string
}

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedMembers: string[]
  sessionId: string
  taskToEdit?: Task
}

export default function TaskDialog({ isOpen, onClose, selectedMembers, sessionId, taskToEdit }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(TASK_COLORS[9].value) // Default to Indigo
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<{ hours: string; minutes: string }>({ hours: "12", minutes: "00" })
  const [assignedMembers, setAssignedMembers] = useState<string[]>(selectedMembers)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!taskToEdit

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchTeamMembers()
      
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
  }, [isOpen, sessionId, taskToEdit, selectedMembers])

  const fetchTeamMembers = async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      let teamId;
      
      try {
        // First, try to get the team ID associated with the session
        teamId = await sessionService.getSessionTeam(sessionId)
        console.log(`Found team ID: ${teamId} for session: ${sessionId}`)
      } catch (error: any) {
        console.warn(`Could not get team ID from session service: ${error.message}`)
        console.log('Falling back to using sessionId as teamId')
        teamId = sessionId // Fallback to using sessionId directly
      }
      
      if (!teamId) {
        throw new Error(`No team found for session ${sessionId}`)
      }
      
      // Use the teamService to get team members
      const teamMembersData = await teamService.getTeamMembers(teamId)
      
      // Process the team data to create a unified array with proper roles
      const processedMembers: TeamMember[] = []
      
      // Add the leader with a Leader role
      if (teamMembersData.leader) {
        if (typeof teamMembersData.leader === 'object' && teamMembersData.leader !== null) {
          processedMembers.push({
            ...teamMembersData.leader,
            role: 'Leader'
          })
        }
      }
      
      // Add members with a Member role
      if (teamMembersData.members && Array.isArray(teamMembersData.members)) {
        teamMembersData.members.forEach((member) => {
          if (typeof member === 'object' && member !== null) {
            processedMembers.push({
              ...member,
              role: 'Member'
            })
          }
        })
      }
      
      setTeamMembers(processedMembers)
    } catch (err) {
      console.error("Failed to fetch team members:", err)
      toast.error("Error", {
        description: "Failed to load team members. Some functionality may be limited.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one member is selected
    if (assignedMembers.length === 0) {
      toast.error("Member Required", {
        description: "Please select at least one team member to assign this task to.",
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
      priority,
      dueDate: dueDateTime ? dueDateTime.toISOString() : undefined,
      assignedMembers,
      color,
      sessionId: sessionId, // Fix: changed 'session' to 'sessionId'
    }
    
    if (isEditMode && taskToEdit) {
      // Update existing task
      taskService.updateTask(taskToEdit._id, taskData)
        .then(updatedTask => {
          toast.success("Task updated", {
            description: `Task "${title}" has been updated successfully.`,
          })
          resetForm()
          onClose()
        })
        .catch(error => {
          console.error("Error updating task:", error)
          toast.error("Error", {
            description: "Failed to update task. Please try again.",
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
        .then(createdTask => {
          toast.success("Task created", {
            description: `Task "${title}" has been created and assigned to ${
              assignedMembers.length
            } member${assignedMembers.length !== 1 ? "s" : ""}.`,
          })
          resetForm()
          onClose()
        })
        .catch(error => {
          console.error("Error creating task:", error)
          toast.error("Error", {
            description: "Failed to create task. Please try again.",
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
  }

  const handleRemoveMember = (memberId: string) => {
    setAssignedMembers(assignedMembers.filter((id) => id !== memberId))
  }

  const handleAddMember = (memberId: string) => {
    if (!assignedMembers.includes(memberId)) {
      setAssignedMembers([...assignedMembers, memberId])
    }
  }

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    // Validate input
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    if (field === 'hours') {
      numValue = Math.max(0, Math.min(23, numValue));
      setTime({ ...time, hours: numValue.toString().padStart(2, '0') });
    } else {
      numValue = Math.max(0, Math.min(59, numValue));
      setTime({ ...time, minutes: numValue.toString().padStart(2, '0') });
    }
  }

  const handleClose = () => {
    // First reset the form to prevent stale data
    resetForm()
    // Then call the parent's onClose function
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update task details and assignments." 
              : "Create a new task and assign it to team members."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Task Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {TASK_COLORS.map((taskColor) => (
                  <button
                    key={taskColor.value}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      color === taskColor.value ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                    )}
                    style={{ backgroundColor: taskColor.value }}
                    onClick={() => setColor(taskColor.value)}
                    title={taskColor.name}
                  >
                    {color === taskColor.value && (
                      <CheckCircle2 className="h-4 w-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Tabs 
                defaultValue={priority} 
                onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="low" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900">
                    Low
                  </TabsTrigger>
                  <TabsTrigger value="medium" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
                    Medium
                  </TabsTrigger>
                  <TabsTrigger value="high" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900">
                    High
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="space-y-2">
            <Label>Due Date & Time</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={time.hours}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    className="pl-9 pr-3 w-20 text-center"
                    placeholder="HH"
                  />
                </div>
                <span className="text-xl font-medium">:</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={time.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-20 text-center"
                  placeholder="MM"
                />
              </div>
            </div>
          </div>

          {/* Assigned Members */}
          <div className="space-y-2">
            <Label>Assigned Members</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span>Loading team members...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3 min-h-10 p-2 border rounded-md bg-muted/20">
                  {assignedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members assigned</p>
                  ) : (
                    assignedMembers.map((memberId) => {
                      const member = teamMembers.find((m) => m._id === memberId)
                      return (
                        member && (
                          <Badge key={member._id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                            {member.fullName || member.username}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-muted p-0.5"
                              onClick={() => handleRemoveMember(member._id)}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      )
                    })
                  )}
                </div>

                <Select onValueChange={handleAddMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers
                      .filter((member) => !assignedMembers.includes(member._id))
                      .map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          <div className="flex items-center gap-2">
                            <span>{member.fullName || member.username}</span>
                            {member.role && (
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
