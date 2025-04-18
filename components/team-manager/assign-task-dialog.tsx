"use client"

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

export function AssignTaskDialog({ open, onOpenChange, memberIds, members }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically save the task assignment to your backend
    console.log("Assigning task to members with IDs:", memberIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Create a new task and assign it to {members.length} selected team member{members.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="assignees" className="mb-2 block">
                Assignees
              </Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                {members.map((member) => (
                  <div key={member.id} className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm">
                    {member.name}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="task-title" className="mb-2 block">
                Task Title
              </Label>
              <Input id="task-title" placeholder="Enter task title" />
            </div>
            <div>
              <Label htmlFor="task-description" className="mb-2 block">
                Description
              </Label>
              <Textarea id="task-description" placeholder="Describe the task details..." rows={4} />
            </div>
            <div>
              <Label htmlFor="priority" className="mb-2 block">
                Priority
              </Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due-date" className="mb-2 block">
                Due Date
              </Label>
              <Input id="due-date" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Assign Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
