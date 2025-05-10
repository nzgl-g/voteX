"use client"

import { useState } from "react"
import type { SessionData, SessionType, VotingMode } from "./vote-session-management"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Calendar, Edit, Save, X, Award, Users, BarChart3, Clock, CheckCircle2,
  TimerOff, Timer, Building, Info, Settings, Calendar as CalendarIcon, Check,
  ChevronRight, ChevronDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"

interface SessionMetadataProps {
  sessionData: SessionData
  editData: SessionData
  isEditing: boolean
  isActive: boolean
  onUpdate: (data: Partial<SessionData>) => void
  onChange: (field: keyof SessionData, value: any) => void
}

export function SessionMetadata({
                                  sessionData,
                                  editData,
                                  isEditing,
                                  isActive,
                                  onUpdate,
                                  onChange
                                }: SessionMetadataProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSection, setExpandedSection] = useState<string | null>("overview")

  const handleChange = (field: keyof SessionData, value: any) => {
    onChange(field, value)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Get current stage of the voting process
  const getCurrentStage = () => {
    const now = new Date()

    // Check if nomination dates are valid before comparing
    const hasNomination = sessionData.nominationStart && sessionData.nominationEnd &&
        sessionData.nominationStart !== sessionData.nominationEnd

    const nominationStart = hasNomination ? new Date(sessionData.nominationStart) : null
    const nominationEnd = hasNomination ? new Date(sessionData.nominationEnd) : null
    const votingStart = new Date(sessionData.votingStart)
    const votingEnd = new Date(sessionData.votingEnd)

    // Only check nomination stage if valid nomination dates exist
    if (hasNomination && nominationStart && nominationEnd) {
      if (now < nominationStart) {
        return "upcoming"
      } else if (now >= nominationStart && now <= nominationEnd) {
        return "nomination"
      } else if (now > nominationEnd && now < votingStart) {
        return "pre-voting"
      }
    } else if (now < votingStart) {
      return "upcoming"
    }

    if (now >= votingStart && now <= votingEnd) {
      return "voting"
    } else {
      return "completed"
    }
  }

  const currentStage = getCurrentStage()

  // Calculate progress percentage for progress bar
  const calculateProgress = () => {
    const now = new Date().getTime()
    const hasNomination = sessionData.nominationStart && sessionData.nominationEnd &&
        sessionData.nominationStart !== sessionData.nominationEnd

    const nominationStart = hasNomination ? new Date(sessionData.nominationStart).getTime() : null
    const nominationEnd = hasNomination ? new Date(sessionData.nominationEnd).getTime() : null
    const votingStart = new Date(sessionData.votingStart).getTime()
    const votingEnd = new Date(sessionData.votingEnd).getTime()

    // Define total timeline duration
    let startTime, endTime

    if (hasNomination && nominationStart) {
      startTime = nominationStart
    } else {
      startTime = votingStart
    }

    endTime = votingEnd
    const totalDuration = endTime - startTime

    // If session hasn't started yet
    if (now < startTime) return 0

    // If session is completed
    if (now > endTime) return 100

    // Calculate progress
    const elapsed = now - startTime
    return Math.min(Math.floor((elapsed / totalDuration) * 100), 100)
  }

  // Format date in a more readable way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch (e) {
      return "Invalid date"
    }
  }

  // Get max voter limit information
  const getMaxVoterInfo = () => {
    let plan = 'Free'
    let limit = '100'

    // Detect plan from session type
    if (sessionData.sessionType !== 'Poll') {
      plan = 'Pro'
      limit = '10,000'
    }

    return { plan, limit }
  }

  // Get status badge color based on current stage
  const getStatusBadge = () => {
    switch (currentStage) {
      case "upcoming":
        return { label: "Upcoming", variant: "secondary" as const, color: "bg-blue-100 text-blue-800" }
      case "nomination":
        return { label: "Nomination Active", variant: "secondary" as const, color: "bg-purple-100 text-purple-800" }
      case "pre-voting":
        return { label: "Preparing Voting", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" }
      case "voting":
        return { label: "Voting Active", variant: "default" as const, color: "bg-green-100 text-green-800" }
      case "completed":
        return { label: "Completed", variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
      default:
        return { label: "Unknown", variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
    }
  }

  const statusBadge = getStatusBadge()
  const progress = calculateProgress()

  return (
      <Card className="border-0 shadow-sm rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              {isEditing ? (
                  <Input
                      id="title"
                      value={editData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="text-2xl font-bold border-none bg-white/90 px-3 py-2 rounded-md shadow-sm"
                      placeholder="Session title"
                  />
              ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{sessionData.title}</h1>
              )}

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
                {getMaxVoterInfo().plan === 'Pro' && (
                    <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                  Pro Plan
                </span>
                )}
              </div>
            </div>

            {isActive && (
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-32 h-2 bg-gray-200" />
                  <span className="text-sm font-medium text-gray-600">{progress}%</span>
                </div>
            )}
          </div>

          {isEditing ? (
              <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                  className="mt-3 text-sm border-none bg-white/90 px-3 py-2 rounded-md shadow-sm"
                  placeholder="Add a description for this session..."
              />
          ) : (
              <p className="mt-3 text-sm text-gray-600">{sessionData.description || "No description provided"}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Key Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection("keyInfo")}
            >
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Key Information
              </h2>
              {expandedSection === "keyInfo" ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSection === "keyInfo" && (
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard
                      title="Session Type"
                      value={sessionData.sessionType}
                      icon={<Award className="h-5 w-5 text-primary" />}
                  />
                  <InfoCard
                      title="Voting Mode"
                      value={sessionData.votingMode}
                      icon={<Users className="h-5 w-5 text-primary" />}
                  />
                  <InfoCard
                      title="Organization"
                      value={sessionData.organizationName || "Not specified"}
                      icon={<Building className="h-5 w-5 text-primary" />}
                  />
                  <InfoCard
                      title="Max Voters"
                      value={`${getMaxVoterInfo().limit}`}
                      icon={<Check className="h-5 w-5 text-primary" />}
                  />
                </div>
            )}
          </div>

          {/* Timeline Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection("timeline")}
            >
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline
              </h2>
              {expandedSection === "timeline" ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSection === "timeline" && (
                <div className="p-4 pt-0">
                  <div className="relative py-6">
                    {/* Timeline bar */}
                    <div className="absolute top-8 left-0 w-full h-1.5 bg-gray-200 rounded-full">
                      <div
                          className="absolute top-0 left-0 h-full bg-primary rounded-full"
                          style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Timeline points */}
                    {(sessionData.nominationStart &&
                        sessionData.nominationEnd &&
                        sessionData.nominationStart !== sessionData.nominationEnd) ||
                    (isEditing && sessionData.sessionType !== "Poll") ? (
                        <div className="grid grid-cols-4 gap-0">
                          <TimelinePoint
                              title="Nomination Start"
                              date={sessionData.nominationStart}
                              isActive={currentStage === "nomination" || currentStage === "pre-voting" || currentStage === "voting" || currentStage === "completed"}
                              isCurrent={currentStage === "nomination"}
                              isEditing={isEditing && !isActive}
                              onDateChange={(value) => handleChange("nominationStart", value)}
                              value={editData.nominationStart}
                              icon={<Clock className="h-5 w-5" />}
                          />

                          <TimelinePoint
                              title="Nomination End"
                              date={sessionData.nominationEnd}
                              isActive={currentStage === "pre-voting" || currentStage === "voting" || currentStage === "completed"}
                              isCurrent={currentStage === "pre-voting"}
                              isEditing={isEditing && !isActive}
                              onDateChange={(value) => handleChange("nominationEnd", value)}
                              value={editData.nominationEnd}
                              icon={<TimerOff className="h-5 w-5" />}
                          />

                          <TimelinePoint
                              title="Voting Start"
                              date={sessionData.votingStart}
                              isActive={currentStage === "voting" || currentStage === "completed"}
                              isCurrent={currentStage === "voting"}
                              isEditing={isEditing && !isActive}
                              onDateChange={(value) => handleChange("votingStart", value)}
                              value={editData.votingStart}
                              icon={<Timer className="h-5 w-5" />}
                          />

                          <TimelinePoint
                              title="Voting End"
                              date={sessionData.votingEnd}
                              isActive={currentStage === "completed"}
                              isCurrent={false}
                              isEditing={isEditing}
                              onDateChange={(value) => handleChange("votingEnd", value)}
                              value={editData.votingEnd}
                              icon={<CheckCircle2 className="h-5 w-5" />}
                          />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-0">
                          <TimelinePoint
                              title="Voting Start"
                              date={sessionData.votingStart}
                              isActive={currentStage === "voting" || currentStage === "completed"}
                              isCurrent={currentStage === "voting"}
                              isEditing={isEditing && !isActive}
                              onDateChange={(value) => handleChange("votingStart", value)}
                              value={editData.votingStart}
                              icon={<Timer className="h-5 w-5" />}
                          />

                          <TimelinePoint
                              title="Voting End"
                              date={sessionData.votingEnd}
                              isActive={currentStage === "completed"}
                              isCurrent={false}
                              isEditing={isEditing}
                              onDateChange={(value) => handleChange("votingEnd", value)}
                              value={editData.votingEnd}
                              icon={<CheckCircle2 className="h-5 w-5" />}
                          />

                          {isEditing && sessionData.sessionType !== "Poll" && (
                              <div className="col-span-2 mt-6 text-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const now = new Date()
                                      const tomorrow = new Date(now)
                                      tomorrow.setDate(tomorrow.getDate() + 1)

                                      handleChange("nominationStart", now.toISOString())
                                      handleChange("nominationEnd", tomorrow.toISOString())
                                    }}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Add Nomination Period
                                </Button>
                              </div>
                          )}
                        </div>
                    )}
                  </div>
                </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection("settings")}
            >
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Session Settings
              </h2>
              {expandedSection === "settings" ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSection === "settings" && (
                <div className="p-4 pt-0">
                  {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="sessionType">Session Type</Label>
                            <Select
                                value={editData.sessionType}
                                onValueChange={(value) => handleChange("sessionType", value as SessionType)}
                                disabled={isActive}
                            >
                              <SelectTrigger id="sessionType" className="w-full">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Poll">Poll</SelectItem>
                                <SelectItem value="Election">Election</SelectItem>
                                <SelectItem value="Tournament">Tournament</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="organization">Organization</Label>
                            <Input
                                id="organization"
                                value={editData.organizationName}
                                onChange={(e) => handleChange("organizationName", e.target.value)}
                                placeholder="Enter organization name"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="votingMode">Voting Mode</Label>
                            <Select
                                value={editData.votingMode}
                                onValueChange={(value) => handleChange("votingMode", value as VotingMode)}
                                disabled={isActive}
                            >
                              <SelectTrigger id="votingMode" className="w-full">
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
                      </div>
                  ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          {isActive
                              ? "Settings cannot be modified while session is active"
                              : "Enable edit mode to modify session settings"}
                        </p>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Created on: {formatDate(sessionData.creationDate)}
          </p>
          <div className="flex items-center gap-2">
            {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => onUpdate({})}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => onUpdate(editData)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
            ) : (
                <Button variant="outline" size="sm" disabled={isActive}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Session
                </Button>
            )}
          </div>
        </div>
      </Card>
  )
}

// Reusable info card component
function InfoCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full text-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-base font-semibold text-gray-900">{value}</p>
        </div>
      </div>
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
  // Format the date or return a placeholder
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"

    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      console.error("Invalid date:", dateString)
      return "Invalid date"
    }
  }

  // Check if this is the voting start date which shouldn't be editable when active
  const isVotingStartDate = title === "Voting Start"

  return (
      <div className="pt-4 relative">
        <div
            className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white
      ${
                isActive
                    ? isCurrent
                        ? "bg-primary text-white shadow-lg"
                        : "bg-primary text-white"
                    : "bg-gray-300 text-gray-600"
            }`}
        >
          {icon}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          {isEditing ? (
              <Input
                  type="datetime-local"
                  value={value || ""}
                  onChange={(e) => onDateChange(e.target.value)}
                  className={`mt-2 text-xs h-9 ${isVotingStartDate && isActive ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={isVotingStartDate && isActive}
              />
          ) : (
              <p className={`mt-1 text-sm ${isCurrent ? "text-primary font-semibold" : "text-gray-600"}`}>
                {formatDate(date)}
              </p>
          )}
        </div>
      </div>
  )
}