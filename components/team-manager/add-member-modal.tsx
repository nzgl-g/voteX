"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn-ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { toast } from "@/components/shadcn-ui/use-toast"
import { Search, Mail } from "lucide-react"
import { inviteTeamMember } from "@/lib/team-service"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
}

export default function AddMemberModal({ isOpen, onClose, sessionId }: AddMemberModalProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [message, setMessage] = useState(
    "Hi there! I'd like to invite you to join our team on our project management platform.",
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session ID is missing. Please try again later.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await inviteTeamMember(sessionId, inviteEmail)
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      })
      setInviteEmail("")
      setMessage("Hi there! I'd like to invite you to join our team on our project management platform.")
      onClose()
    } catch (error) {
      console.error("Failed to send invitation:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Join request sent",
      description: `A join request has been sent to ${searchEmail}.`,
    })
    setSearchEmail("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Invite someone to join your team or search for existing users.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Invitation</TabsTrigger>
            <TabsTrigger value="invite">Invite via Email</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <form onSubmit={handleSearchSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search-email">Search by email</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-email"
                    placeholder="Enter email address"
                    className="pl-8"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Send Join Request</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="invite">
            <form onSubmit={handleInviteSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    placeholder="Enter email address"
                    className="pl-8"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Invitation message</Label>
                <Textarea
                  id="message"
                  placeholder="Write a custom message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
