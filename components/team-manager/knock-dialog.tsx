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
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Label } from "@/components/shadcn-ui/label"
import { Bell } from "lucide-react"
import { Checkbox } from "@/components/shadcn-ui/checkbox"

export function KnockDialog({ open, onOpenChange, memberIds, members }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the notification to your backend
    console.log("Sending notification to members with IDs:", memberIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to {members.length} selected team member{members.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="recipients" className="mb-2 block">
                Recipients
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
              <Label htmlFor="message" className="mb-2 block">
                Message
              </Label>
              <Textarea id="message" placeholder="Type your notification message here..." rows={4} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="urgent" />
              <Label htmlFor="urgent">Mark as urgent</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Send Notification</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
