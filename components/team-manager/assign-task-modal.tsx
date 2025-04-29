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
} from "@/components/shadcn-ui/dialog"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Calendar } from "@/components/shadcn-ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn-ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Badge } from "@/components/shadcn-ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/shadcn-ui/command"
import { ScrollArea } from "@/components/shadcn-ui/scroll-area"

interface TeamMember {
  id: string
  username: string
  fullName: string
  email: string
  role: string
  status: string
}

interface AssignTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAssignTask: (taskData: any) => void
  teamMembers: TeamMember[]
  initialSelectedMembers: string[]
}

export function AssignTaskModal({
  isOpen,
  onClose,
  onAssignTask,
  teamMembers,
  initialSelectedMembers,
}: AssignTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskColor, setTaskColor] = useState("#4f46e5")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [priority, setPriority] = useState("medium")
  const [activeDatePicker, setActiveDatePicker] = useState<"start" | "end">("start")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberIds(initialSelectedMembers)
    }
  }, [isOpen, initialSelectedMembers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskTitle) {
      const selectedMembers = teamMembers.filter((member) => selectedMemberIds.includes(member.id))

      onAssignTask({
        title: taskTitle,
        description: taskDescription,
        color: taskColor,
        startDate,
        endDate,
        priority,
        assignees: selectedMembers,
      })
      resetForm()
    }
  }

  const resetForm = () => {
    setTaskTitle("")
    setTaskDescription("")
    setTaskColor("#4f46e5")
    setStartDate(new Date())
    setEndDate(new Date())
    setPriority("medium")
    setSelectedMemberIds([])
  }

  const priorityColors = {
    low: "bg-green-100 text-green-800 hover:bg-green-100",
    medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    high: "bg-red-100 text-red-800 hover:bg-red-100",
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (activeDatePicker === "start") {
      setStartDate(date)
    } else {
      setEndDate(date)
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  const removeMember = (memberId: string) => {
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>Create a new task and assign it to team members</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Task Description</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-color">Task Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="task-color"
                  type="color"
                  value={taskColor}
                  onChange={(e) => setTaskColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: taskColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                      onClick={() => {
                        setActiveDatePicker("start")
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={handleDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                      onClick={() => {
                        setActiveDatePicker("end")
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={handleDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority">
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assign Team Members</Label>
              <div className="relative">
                <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={commandOpen}
                      className="w-full justify-between"
                    >
                      Select team members
                      <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search team members..." />
                      <CommandList>
                        <CommandEmpty>No team member found.</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-64">
                            {teamMembers.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={member.id}
                                onSelect={() => {
                                  toggleMember(member.id)
                                  setCommandOpen(false)
                                }}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`mr-2 h-4 w-4 rounded-sm border ${
                                      selectedMemberIds.includes(member.id)
                                        ? "bg-primary border-primary"
                                        : "border-input"
                                    }`}
                                  >
                                    {selectedMemberIds.includes(member.id) && (
                                      <div className="flex h-full items-center justify-center text-primary-foreground">
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                  <span>{member.fullName}</span>
                                  <span className="ml-2 text-muted-foreground">@{member.username}</span>
                                  <div
                                    className={`ml-auto h-2 w-2 rounded-full ${
                                      member.status === "online" ? "bg-green-500" : "bg-gray-300"
                                    }`}
                                  ></div>
                                </div>
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedMemberIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMemberIds.map((id) => {
                    const member = teamMembers.find((m) => m.id === id)
                    if (!member) return null

                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {member.fullName}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeMember(id)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {member.fullName}</span>
                        </Button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedMemberIds.length === 0}>
              Assign Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
