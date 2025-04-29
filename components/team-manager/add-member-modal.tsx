"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn-ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Alert, AlertDescription } from "@/components/shadcn-ui/alert"
import { CheckCircle2 } from "lucide-react"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAddMember: (email: string, isInvite: boolean) => void
}

export function AddMemberModal({ isOpen, onClose, onAddMember }: AddMemberModalProps) {
  const [activeTab, setActiveTab] = useState("invitation")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("I'd like to invite you to join our team on the platform.")
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent, isInvite: boolean) => {
    e.preventDefault()
    if (email) {
      if (isInvite) {
        setShowSuccess(true)
        setTimeout(() => {
          onAddMember(email, true)
          resetForm()
        }, 2000)
      } else {
        onAddMember(email, false)
        resetForm()
      }
    }
  }

  const resetForm = () => {
    setEmail("")
    setMessage("I'd like to invite you to join our team on the platform.")
    setShowSuccess(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Add existing users or invite new members to your team.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invitation">Add Existing User</TabsTrigger>
            <TabsTrigger value="email">Invite via Email</TabsTrigger>
          </TabsList>

          <TabsContent value="invitation">
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-search">Email</Label>
                  <Input
                    id="email-search"
                    type="email"
                    placeholder="Search by email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Add to Team</Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="email">
            <form onSubmit={(e) => handleSubmit(e, true)}>
              <div className="grid gap-4 py-4">
                {showSuccess ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">Invitation sent successfully!</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-message">Invitation Message</Label>
                      <Textarea
                        id="invite-message"
                        placeholder="Write a custom message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button type="submit">Send Invitation</Button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
