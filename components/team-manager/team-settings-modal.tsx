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
import { Switch } from "@/components/shadcn-ui/switch"

interface TeamSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateSettings: (teamName: string, allowMembersToChangeSettings: boolean) => void
  teamName: string
  allowMembersToChangeSettings: boolean
}

export function TeamSettingsModal({
  isOpen,
  onClose,
  onUpdateSettings,
  teamName,
  allowMembersToChangeSettings,
}: TeamSettingsModalProps) {
  const [name, setName] = useState(teamName)
  const [allowChanges, setAllowChanges] = useState(allowMembersToChangeSettings)
  const [error, setError] = useState("")

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(teamName)
      setAllowChanges(allowMembersToChangeSettings)
      setError("")
    } else {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Team name is required")
      return
    }

    onUpdateSettings(name, allowChanges)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
            <DialogDescription>Update your team's name and settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-settings-change">Allow Members to Change Settings</Label>
              <Switch id="allow-settings-change" checked={allowChanges} onCheckedChange={setAllowChanges} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
