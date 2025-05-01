"use client"

import type React from "react"

import { useState } from "react"
import type { SessionData, SessionType, VotingMode } from "./vote-session-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Button } from "@/components/shadcn-ui/button"
import { Calendar, Edit, Save, X, Award, Users, BarChart3, Clock, CheckCircle2, TimerOff, Timer } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/shadcn-ui/badge"

interface SessionMetadataProps {
  sessionData: SessionData
  onUpdate: (data: Partial<SessionData>) => void
}

export function SessionMetadata({ sessionData, onUpdate }: SessionMetadataProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(sessionData)

  const handleChange = (field: keyof SessionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate(formData)
    setIsEditing(false)
    toast({
      title: "Changes saved",
      description: "Session metadata has been updated successfully.",
    })
  }

  // Get current stage of the voting process
  const getCurrentStage = () => {
    const now = new Date()
    const nominationStart = new Date(sessionData.nominationStart)
    const nominationEnd = new Date(sessionData.nominationEnd)
    const votingStart = new Date(sessionData.votingStart)
    const votingEnd = new Date(sessionData.votingEnd)

    if (now < nominationStart) {
      return "upcoming"
    } else if (now >= nominationStart && now <= nominationEnd) {
      return "nomination"
    } else if (now > nominationEnd && now < votingStart) {
      return "pre-voting"
    } else if (now >= votingStart && now <= votingEnd) {
      return "voting"
    } else {
      return "completed"
    }
  }

  const currentStage = getCurrentStage()

  // Format date in a more readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-xl font-bold flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Session Details
        </CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setFormData(sessionData)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          {isEditing ? (
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            <h2 className="text-2xl font-bold text-center">{sessionData.title}</h2>
          )}

          {isEditing ? (
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              className="mt-2"
            />
          ) : (
            <p className="text-center text-muted-foreground">{sessionData.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              <Label htmlFor="organization" className="font-medium">
                Organization
              </Label>
            </div>
            {isEditing ? (
              <Input
                id="organization"
                value={formData.organizationName}
                onChange={(e) => handleChange("organizationName", e.target.value)}
              />
            ) : (
              <div className="text-sm font-medium bg-muted/50 p-2 rounded-md">{sessionData.organizationName}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <Label className="font-medium">Created On</Label>
            </div>
            <div className="text-sm bg-muted/50 p-2 rounded-md">{formatDate(sessionData.creationDate)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <div className="flex flex-col items-center">
            <Badge variant="outline" className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border-primary/20">
              {sessionData.sessionType}
            </Badge>
            <span className="text-xs text-muted-foreground mt-1">Session Type</span>
          </div>

          <div className="flex flex-col items-center">
            <Badge variant="outline" className="px-3 py-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/20">
              {sessionData.votingMode}
            </Badge>
            <span className="text-xs text-muted-foreground mt-1">Voting Mode</span>
          </div>

          {isEditing && (
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="sessionType">Change Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value) => handleChange("sessionType", value as SessionType)}
                >
                  <SelectTrigger id="sessionType" className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poll">Poll</SelectItem>
                    <SelectItem value="Election">Election</SelectItem>
                    <SelectItem value="Tournament">Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="votingMode">Change Mode</Label>
                <Select
                  value={formData.votingMode}
                  onValueChange={(value) => handleChange("votingMode", value as VotingMode)}
                >
                  <SelectTrigger id="votingMode" className="mt-1">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Choice">Single Choice</SelectItem>
                    <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    <SelectItem value="Ranked Choice">Ranked Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium">Session Timeline</h3>
          </div>

          <div className="relative">
            {/* Timeline bar */}
            <div className="absolute top-4 left-0 w-full h-1 bg-muted">
              <div
                className={`absolute top-0 left-0 h-full bg-primary ${
                  currentStage === "upcoming"
                    ? "w-0"
                    : currentStage === "nomination"
                      ? "w-1/4"
                      : currentStage === "pre-voting"
                        ? "w-1/2"
                        : currentStage === "voting"
                          ? "w-3/4"
                          : "w-full"
                }`}
              />
            </div>

            {/* Timeline points */}
            <div className="grid grid-cols-4 gap-0">
              <TimelinePoint
                title="Nomination Start"
                date={sessionData.nominationStart}
                isActive={
                  currentStage === "nomination" ||
                  currentStage === "pre-voting" ||
                  currentStage === "voting" ||
                  currentStage === "completed"
                }
                isCurrent={currentStage === "nomination"}
                isEditing={isEditing}
                onDateChange={(value) => handleChange("nominationStart", value)}
                value={formData.nominationStart}
                icon={<Clock className="h-4 w-4" />}
              />

              <TimelinePoint
                title="Nomination End"
                date={sessionData.nominationEnd}
                isActive={currentStage === "pre-voting" || currentStage === "voting" || currentStage === "completed"}
                isCurrent={currentStage === "pre-voting"}
                isEditing={isEditing}
                onDateChange={(value) => handleChange("nominationEnd", value)}
                value={formData.nominationEnd}
                icon={<TimerOff className="h-4 w-4" />}
              />

              <TimelinePoint
                title="Voting Start"
                date={sessionData.votingStart}
                isActive={currentStage === "voting" || currentStage === "completed"}
                isCurrent={currentStage === "voting"}
                isEditing={isEditing}
                onDateChange={(value) => handleChange("votingStart", value)}
                value={formData.votingStart}
                icon={<Timer className="h-4 w-4" />}
              />

              <TimelinePoint
                title="Voting End"
                date={sessionData.votingEnd}
                isActive={currentStage === "completed"}
                isCurrent={false}
                isEditing={isEditing}
                onDateChange={(value) => handleChange("votingEnd", value)}
                value={formData.votingEnd}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TimelinePointProps {
  title: string
  date: string
  isActive: boolean
  isCurrent: boolean
  isEditing: boolean
  onDateChange: (value: string) => void
  value: string
  icon: React.ReactNode
}

function TimelinePoint({ title, date, isActive, isCurrent, isEditing, onDateChange, value, icon }: TimelinePointProps) {
  return (
    <div className="pt-4 relative">
      <div
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10
        ${
          isActive
            ? isCurrent
              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
              : "bg-primary/80 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm font-medium">{title}</p>
        {isEditing ? (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1 text-xs h-8"
          />
        ) : (
          <p className={`text-xs ${isCurrent ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  )
}
