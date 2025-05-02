"use client"

import { useState } from "react"
import type { SessionData, SessionType, VotingMode } from "./vote-session-management"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn-ui/card"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Button } from "@/components/shadcn-ui/button"
import {
  Calendar, Edit, Save, X, Award, Users, BarChart3, Clock, CheckCircle2,
  TimerOff, Timer, Building, Info, Settings, Calendar as CalendarIcon, Check
} from "lucide-react"
import { Badge } from "@/components/shadcn-ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Separator } from "@/components/shadcn-ui/separator"

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

  const handleChange = (field: keyof SessionData, value: any) => {
    onChange(field, value);
  }

  // Get current stage of the voting process
  const getCurrentStage = () => {
    const now = new Date()

    // Check if nomination dates are valid before comparing
    const hasNomination = sessionData.nominationStart && sessionData.nominationEnd &&
        sessionData.nominationStart !== sessionData.nominationEnd;

    const nominationStart = hasNomination ? new Date(sessionData.nominationStart) : null;
    const nominationEnd = hasNomination ? new Date(sessionData.nominationEnd) : null;
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
    const now = new Date().getTime();
    const hasNomination = sessionData.nominationStart && sessionData.nominationEnd &&
        sessionData.nominationStart !== sessionData.nominationEnd;

    const nominationStart = hasNomination ? new Date(sessionData.nominationStart).getTime() : null;
    const nominationEnd = hasNomination ? new Date(sessionData.nominationEnd).getTime() : null;
    const votingStart = new Date(sessionData.votingStart).getTime();
    const votingEnd = new Date(sessionData.votingEnd).getTime();

    // Define total timeline duration
    let startTime, endTime;

    if (hasNomination && nominationStart) {
      startTime = nominationStart;
    } else {
      startTime = votingStart;
    }

    endTime = votingEnd;
    const totalDuration = endTime - startTime;

    // If session hasn't started yet
    if (now < startTime) return 0;

    // If session is completed
    if (now > endTime) return 100;

    // Calculate progress
    const elapsed = now - startTime;
    return Math.min(Math.floor((elapsed / totalDuration) * 100), 100);
  }

  // Format date in a more readable way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  }

  // Get max voter limit information
  const getMaxVoterInfo = () => {
    let plan = 'Free';
    let limit = '100';

    // Detect plan from session type
    if (sessionData.sessionType !== 'Poll') {
      plan = 'Pro';
      limit = '10,000';
    }

    return { plan, limit };
  };

  // Get status badge color based on current stage
  const getStatusBadge = () => {
    switch(currentStage) {
      case "upcoming":
        return { label: "Upcoming", variant: "outline" as const };
      case "nomination":
        return { label: "Nomination Active", variant: "secondary" as const };
      case "pre-voting":
        return { label: "Preparing Voting", variant: "secondary" as const };
      case "voting":
        return { label: "Voting Active", variant: "default" as const };
      case "completed":
        return { label: "Completed", variant: "outline" as const };
      default:
        return { label: "Unknown", variant: "outline" as const };
    }
  }

  const statusBadge = getStatusBadge();
  const progress = calculateProgress();

  return (
      <Card className="overflow-hidden shadow-md">
        <div className="pt-4 px-6 flex justify-end">
          <div className="flex flex-row gap-2 items-center">
            <Badge variant={statusBadge.variant} className="whitespace-nowrap font-medium">
              {statusBadge.label}
            </Badge>
            {(getMaxVoterInfo().plan === 'Pro') && (
                <Badge variant="secondary" className="bg-muted hover:bg-muted/70">
                  Pro
                </Badge>
            )}
          </div>
        </div>
        
        <CardHeader className="pb-2 pt-2">
          <div className="flex flex-col">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="text-xl font-bold"
                />
              ) : (
                <CardTitle className="text-xl font-bold">{sessionData.title}</CardTitle>
              )}
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                  className="mt-2 text-sm"
                />
              ) : (
                <CardDescription className="text-sm mt-1">{sessionData.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Progress Bar */}
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${progress}%` }}
            />
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <Info className="h-4 w-4 mr-2 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">
                <CalendarIcon className="h-4 w-4 mr-2 hidden sm:inline" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                <Settings className="h-4 w-4 mr-2 hidden sm:inline" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard
                    title="Session Type"
                    value={sessionData.sessionType}
                    icon={<Award className="h-4 w-4 text-primary" />}
                />
                <InfoCard
                    title="Voting Mode"
                    value={sessionData.votingMode}
                    icon={<Users className="h-4 w-4 text-primary" />}
                />
                <InfoCard
                    title="Organization"
                    value={sessionData.organizationName}
                    icon={<Building className="h-4 w-4 text-primary" />}
                />
                <InfoCard
                    title="Max Voters"
                    value={`${getMaxVoterInfo().limit}`}
                    icon={<Check className="h-4 w-4 text-primary" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="text-sm font-semibold">Active Period</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm p-2 bg-muted/20 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="font-medium">{formatDate(sessionData.votingStart)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End</p>
                      <p className="font-medium">{formatDate(sessionData.votingEnd)}</p>
                    </div>
                  </div>
                </div>

                {sessionData.nominationStart &&
                    sessionData.nominationEnd &&
                    sessionData.nominationStart !== sessionData.nominationEnd && (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="text-sm font-semibold">Nomination Period</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm p-2 bg-muted/20 rounded-md">
                            <div>
                              <p className="text-xs text-muted-foreground">Start</p>
                              <p className="font-medium">{formatDate(sessionData.nominationStart)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">End</p>
                              <p className="font-medium">{formatDate(sessionData.nominationEnd)}</p>
                            </div>
                          </div>
                        </div>
                    )}
              </div>

              <div className="text-xs text-muted-foreground">
                Created on: {formatDate(sessionData.creationDate)}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="relative py-6">
                {/* Timeline bar */}
                <div className="absolute top-8 left-0 w-full h-1 bg-muted">
                  <div
                      className="absolute top-0 left-0 h-full bg-primary"
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
                          icon={<Clock className="h-4 w-4" />}
                      />

                      <TimelinePoint
                          title="Nomination End"
                          date={sessionData.nominationEnd}
                          isActive={currentStage === "pre-voting" || currentStage === "voting" || currentStage === "completed"}
                          isCurrent={currentStage === "pre-voting"}
                          isEditing={isEditing && !isActive}
                          onDateChange={(value) => handleChange("nominationEnd", value)}
                          value={editData.nominationEnd}
                          icon={<TimerOff className="h-4 w-4" />}
                      />

                      <TimelinePoint
                          title="Voting Start"
                          date={sessionData.votingStart}
                          isActive={currentStage === "voting" || currentStage === "completed"}
                          isCurrent={currentStage === "voting"}
                          isEditing={isEditing && !isActive}
                          onDateChange={(value) => handleChange("votingStart", value)}
                          value={editData.votingStart}
                          icon={<Timer className="h-4 w-4" />}
                      />

                      <TimelinePoint
                          title="Voting End"
                          date={sessionData.votingEnd}
                          isActive={currentStage === "completed"}
                          isCurrent={false}
                          isEditing={isEditing}
                          onDateChange={(value) => handleChange("votingEnd", value)}
                          value={editData.votingEnd}
                          icon={<CheckCircle2 className="h-4 w-4" />}
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
                          icon={<Timer className="h-4 w-4" />}
                      />

                      <TimelinePoint
                          title="Voting End"
                          date={sessionData.votingEnd}
                          isActive={currentStage === "completed"}
                          isCurrent={false}
                          isEditing={isEditing}
                          onDateChange={(value) => handleChange("votingEnd", value)}
                          value={editData.votingEnd}
                          icon={<CheckCircle2 className="h-4 w-4" />}
                      />

                      {isEditing && sessionData.sessionType !== "Poll" && (
                          <div className="col-span-2 mt-6 text-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const now = new Date();
                                  const tomorrow = new Date(now);
                                  tomorrow.setDate(tomorrow.getDate() + 1);

                                  handleChange("nominationStart", now.toISOString());
                                  handleChange("nominationEnd", tomorrow.toISOString());
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
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionType">Session Type</Label>
                      <Select
                          value={editData.sessionType}
                          onValueChange={(value) => handleChange("sessionType", value as SessionType)}
                          disabled={isActive}
                      >
                        <SelectTrigger id="sessionType">
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
                      <Label htmlFor="votingMode">Voting Mode</Label>
                      <Select
                          value={editData.votingMode}
                          onValueChange={(value) => handleChange("votingMode", value as VotingMode)}
                          disabled={isActive}
                      >
                        <SelectTrigger id="votingMode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Choice">Single Choice</SelectItem>
                          <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                          <SelectItem value="Ranked Choice">Ranked Choice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                          id="organization"
                          value={editData.organizationName}
                          onChange={(e) => handleChange("organizationName", e.target.value)}
                      />
                    </div>
                  </div>
              ) : (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">
                      {isActive ?
                          "Settings cannot be modified while session is active" :
                          "Enable edit mode to modify session settings"}
                    </p>
                  </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
  )
}

// Reusable info card component
function InfoCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
      <div className="bg-muted/20 p-3 rounded-md flex flex-col items-center justify-center text-center">
        <div className="mb-1">{icon}</div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="font-medium text-sm truncate w-full">{value}</p>
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
    if (!dateString) return "Not set";
    
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "Invalid date";
    }
  };
  
  // Check if this is the voting start date which shouldn't be editable when active
  const isVotingStartDate = title === "Voting Start";

  return (
    <div className="pt-4 relative">
      <div
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10
        ${
          isActive
            ? isCurrent
              ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
              : "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs font-medium">{title}</p>
        {isEditing ? (
          <Input
            type="datetime-local"
            value={value || ""}
            onChange={(e) => onDateChange(e.target.value)}
            className={`mt-1 text-xs h-8 ${isVotingStartDate && isActive ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}`}
            disabled={isVotingStartDate && isActive}
          />
        ) : (
          <p className={`text-xs ${isCurrent ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  )
}