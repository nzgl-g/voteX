"use client"

import { useState } from "react"
import { Input } from "@/components/shadcn-ui/input"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Button } from "@/components/shadcn-ui/button"
import { Label } from "@/components/shadcn-ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Calendar } from "@/components/shadcn-ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn-ui/popover"
import { CalendarIcon, CheckIcon, PencilIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Session } from "@/lib/types"

interface InfoTabProps {
  session: Session
  onUpdate: (data: Partial<Session>) => void
}

export function InfoTab({ session, onUpdate }: InfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: session.name,
    description: session.description || "",
    organizationName: session.organizationName || "",
    type: session.type,
    subtype: session.subtype,
    tournamentType: session.tournamentType || null,
    scheduledStart: new Date(
      session.sessionLifecycle.scheduledAt?.split(" - ")[0] || session.sessionLifecycle.startedAt,
    ),
    scheduledEnd: new Date(session.sessionLifecycle.scheduledAt?.split(" - ")[1] || session.sessionLifecycle.endedAt),
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const scheduledAt = `${format(formData.scheduledStart, "yyyy-MM-dd HH:mm:ss")} - ${format(formData.scheduledEnd, "yyyy-MM-dd HH:mm:ss")}`

    onUpdate({
      name: formData.title,
      description: formData.description,
      organizationName: formData.organizationName,
      type: formData.type as "poll" | "election" | "tournament",
      subtype: formData.subtype as any,
      tournamentType: formData.tournamentType as any,
      sessionLifecycle: {
        ...session.sessionLifecycle,
        scheduledAt,
      },
    })

    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: session.name,
      description: session.description || "",
      organizationName: session.organizationName || "",
      type: session.type,
      subtype: session.subtype,
      tournamentType: session.tournamentType || null,
      scheduledStart: new Date(
        session.sessionLifecycle.scheduledAt?.split(" - ")[0] || session.sessionLifecycle.startedAt,
      ),
      scheduledEnd: new Date(session.sessionLifecycle.scheduledAt?.split(" - ")[1] || session.sessionLifecycle.endedAt),
    })
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Session Information</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave}>
              <CheckIcon className="h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Session Name
            </Label>
            {isEditing ? (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full"
              />
            ) : (
              <p className="text-slate-900 dark:text-white py-2">{session.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Session ID
            </Label>
            <p className="text-slate-900 dark:text-white py-2">{session.id}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Organization Name
            </Label>
            {isEditing ? (
              <Input
                id="organization"
                value={formData.organizationName}
                onChange={(e) => handleChange("organizationName", e.target.value)}
                className="w-full"
              />
            ) : (
              <p className="text-slate-900 dark:text-white py-2">{session.organizationName || "Not specified"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-[120px] resize-none w-full"
              />
            ) : (
              <p className="text-slate-900 dark:text-white py-2 whitespace-pre-wrap">
                {session.description || "No description provided"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Type</Label>
            {isEditing ? (
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="election">Election</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="capitalize text-slate-900 dark:text-white py-2">{session.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subtype</Label>
            {isEditing ? (
              <Select value={formData.subtype} onValueChange={(value) => handleChange("subtype", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ranked">Ranked</SelectItem>
                  <SelectItem value="Multiple">Multiple</SelectItem>
                  <SelectItem value="Single">Single</SelectItem>
                  {formData.type === "tournament" && (
                    <>
                      <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                      <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-slate-900 dark:text-white py-2">{session.subtype}</p>
            )}
          </div>

          {(formData.type === "tournament" || session.type === "tournament") && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tournament Type</Label>
              {isEditing ? (
                <Select
                  value={formData.tournamentType || "none"}
                  onValueChange={(value) => handleChange("tournamentType", value === "none" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tournament type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                    <SelectItem value="Knockout">Knockout</SelectItem>
                    <SelectItem value="Swiss">Swiss</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-slate-900 dark:text-white py-2">{session.tournamentType || "Not specified"}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Created At</Label>
            <p className="text-slate-900 dark:text-white py-2">{session.sessionLifecycle.createdAt}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled Time</Label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.scheduledStart && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledStart ? (
                          format(formData.scheduledStart, "PPP HH:mm")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledStart}
                        onSelect={(date) => date && handleChange("scheduledStart", date)}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={format(formData.scheduledStart, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":")
                            const newDate = new Date(formData.scheduledStart)
                            newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                            handleChange("scheduledStart", newDate)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400">End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.scheduledEnd && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledEnd ? format(formData.scheduledEnd, "PPP HH:mm") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledEnd}
                        onSelect={(date) => date && handleChange("scheduledEnd", date)}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={format(formData.scheduledEnd, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":")
                            const newDate = new Date(formData.scheduledEnd)
                            newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                            handleChange("scheduledEnd", newDate)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white py-2">
                {session.sessionLifecycle.scheduledAt || "Not scheduled"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</Label>
            <p className="text-slate-900 dark:text-white py-2">{session.sessionLifecycle.startedAt}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">End Time</Label>
            <p className="text-slate-900 dark:text-white py-2">{session.sessionLifecycle.endedAt}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
