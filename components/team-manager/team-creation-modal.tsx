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
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"

interface TeamCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTeam: (teamName: string, allowMembersToChangeSettings: boolean) => void
}

export function TeamCreationModal({ isOpen, onClose, onCreateTeam }: TeamCreationModalProps) {
  const [teamName, setTeamName] = useState("")
  const [allowMembersToChangeSettings, setAllowMembersToChangeSettings] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamName.trim()) {
      setError("Team name is required")
      return
    }

    onCreateTeam(teamName, allowMembersToChangeSettings)
    setTeamName("")
    setAllowMembersToChangeSettings(false)
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
            <DialogDescription>Fill in the details below to create your team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Team</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
