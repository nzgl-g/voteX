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
import { toast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"
import { teamService, TeamMember as ApiTeamMember } from "@/api/team-service"
import { sessionService } from "@/api/session-service"
import { taskService } from "@/api/task-service"

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
}

export default function TaskDialog({ isOpen, onClose, selectedMembers, sessionId }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#4f46e5")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [assignedMembers, setAssignedMembers] = useState<string[]>(selectedMembers)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchTeamMembers()
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    setAssignedMembers(selectedMembers)
  }, [selectedMembers])

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
        processedMembers.push({
          ...teamMembersData.leader,
          role: 'Leader'
        })
      }
      
      // Add members with a Member role
      if (teamMembersData.members && Array.isArray(teamMembersData.members)) {
        teamMembersData.members.forEach((member) => {
          processedMembers.push({
            ...member,
            role: 'Member'
          })
        })
      }
      
      setTeamMembers(processedMembers)
    } catch (err) {
      console.error("Failed to fetch team members:", err)
      toast({
        title: "Error",
        description: "Failed to load team members. Some functionality may be limited.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const taskData = {
      title,
      description,
      priority,
      dueDate: date ? date.toISOString() : undefined,
      assignedMembers,
      session: sessionId,
      color,
    }
    
    taskService.createTask(taskData)
      .then(createdTask => {
        toast({
          title: "Task created",
          description: `Task "${title}" has been created and assigned to ${
            assignedMembers.length
          } member${assignedMembers.length !== 1 ? "s" : ""}.`,
        })
        resetForm()
        onClose()
      })
      .catch(error => {
        console.error("Error creating task:", error)
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setColor("#4f46e5")
    setPriority("medium")
    setDate(new Date())
  }

  const handleRemoveMember = (memberId: string) => {
    setAssignedMembers(assignedMembers.filter((id) => id !== memberId))
  }

  const handleAddMember = (memberId: string) => {
    if (!assignedMembers.includes(memberId)) {
      setAssignedMembers([...assignedMembers, memberId])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Create a new task and assign it to team members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 rounded border p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                defaultValue={priority} 
                onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100">
                        Low
                      </Badge>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-yellow-100">
                        Medium
                      </Badge>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-red-100">
                        High
                      </Badge>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <div className="flex gap-2">
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Set Time
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hours">Hours</Label>
                    <Input id="hours" type="number" min="0" max="23" placeholder="HH" />
                    <Label htmlFor="minutes">Minutes</Label>
                    <Input id="minutes" type="number" min="0" max="59" placeholder="MM" />
                    <Button className="mt-2">Set Time</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Members</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span>Loading team members...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {assignedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members assigned</p>
                  ) : (
                    assignedMembers.map((memberId) => {
                      const member = teamMembers.find((m) => m._id === memberId)
                      return (
                        member && (
                          <Badge key={member._id} variant="secondary" className="flex items-center gap-1">
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
                          {member.fullName || member.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
