"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Switch } from "@/components/shadcn-ui/switch"
import { Check, Mail, User, FileText } from "lucide-react"

// Available roles
const roles = ["Team Leader", "Validator", "Support", "Auditor"]

export default function InviteMember() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Inviting member:", { email, role, message })
      setIsSubmitting(false)
      setIsSuccess(true)

      // Reset form after 2 seconds
      setTimeout(() => {
        setEmail("")
        setRole("")
        setMessage("")
        setIsSuccess(false)
      }, 2000)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="mt-1 relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="role" className="text-sm font-medium">
            Assign Role
          </Label>
          <div className="mt-1 relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger id="role" className="pl-10">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="message" className="text-sm font-medium">
            Personal Message (Optional)
          </Label>
          <div className="mt-1 relative rounded-md">
            <div className="absolute top-3 left-3 flex items-center pointer-events-none">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pl-10 min-h-[120px]"
            />
          </div>
        </div>

      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
        {isSubmitting ? (
          "Sending Invitation..."
        ) : isSuccess ? (
          <span className="flex items-center justify-center">
            <Check className="mr-2 h-4 w-4" /> Invitation Sent
          </span>
        ) : (
          "Send Invitation"
        )}
      </Button>
    </form>
  )
}
