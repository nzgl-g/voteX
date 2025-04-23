"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Label } from "@/components/shadcn-ui/label"
import { Calendar } from "@/components/shadcn-ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn-ui/popover"
import { Button } from "@/components/shadcn-ui/button"
import { Switch } from "@/components/shadcn-ui/switch"
import { format, isAfter } from "date-fns"
import { CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/shadcn-ui/input"
import { ProFeatureBadge } from "@/components/shadcn-ui/pro-feature-badge"
import { Alert, AlertDescription } from "@/components/shadcn-ui/alert"

interface LifecycleStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  errors?: Record<string, string>
}

export function LifecycleStep({ formState, updateFormState, errors = {} }: LifecycleStepProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    formState.sessionLifecycle.startedAt ? new Date(formState.sessionLifecycle.startedAt) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    formState.sessionLifecycle.endedAt ? new Date(formState.sessionLifecycle.endedAt) : undefined,
  )

  // State for time inputs
  const [startTime, setStartTime] = useState(startDate ? format(startDate, "HH:mm:ss") : "00:00:00")
  const [endTime, setEndTime] = useState(endDate ? format(endDate, "HH:mm:ss") : "23:59:59")

  const [nominationEnabled, setNominationEnabled] = useState(formState.candidateStep === "nomination")
  const [nominationStartDate, setNominationStartDate] = useState<Date | undefined>(
    formState.sessionLifecycle.scheduledAt.start ? new Date(formState.sessionLifecycle.scheduledAt.start) : undefined,
  )
  const [nominationEndDate, setNominationEndDate] = useState<Date | undefined>(
    startDate ? new Date(startDate.getTime()) : undefined,
  )

  // State for nomination time inputs
  const [nominationStartTime, setNominationStartTime] = useState(
    nominationStartDate ? format(nominationStartDate, "HH:mm:ss") : "00:00:00",
  )
  const [nominationEndTime, setNominationEndTime] = useState(
    nominationEndDate ? format(nominationEndDate, "HH:mm:ss") : "23:59:59",
  )

  // State for validation errors
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({})

  const isPro = formState.subscription.name === "pro" || formState.subscription.name === "enterprise"
  const showNomination = formState.type === "election" || formState.type === "tournament"

  // Validate dates whenever they change
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    if (startDate && endDate) {
      if (isAfter(startDate, endDate)) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    if (nominationEnabled && nominationStartDate && nominationEndDate) {
      if (isAfter(nominationStartDate, nominationEndDate)) {
        newErrors.nominationEndDate = "Nomination end date must be after nomination start date"
      }

      if (startDate && isAfter(nominationEndDate, startDate)) {
        newErrors.nominationEndDate = "Nomination period must end before voting starts"
      }
    }

    setDateErrors(newErrors)
  }, [startDate, endDate, nominationStartDate, nominationEndDate, nominationEnabled])

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    if (date) {
      // Preserve the time when changing the date
      const currentTime = startTime.split(":")
      const hours = Number.parseInt(currentTime[0], 10)
      const minutes = Number.parseInt(currentTime[1], 10)
      const seconds = Number.parseInt(currentTime[2], 10)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, seconds)

      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          startedAt: newDate.toISOString(),
        },
      })

      // If nomination end date is not set or is after the start date, update it
      if (nominationEnabled && (!nominationEndDate || isAfter(nominationEndDate, newDate))) {
        const newNominationEndDate = new Date(newDate)
        newNominationEndDate.setHours(0, 0, 0, 0) // Set to beginning of the day
        setNominationEndDate(newNominationEndDate)

        // Also update the form state
        updateFormState({
          sessionLifecycle: {
            ...formState.sessionLifecycle,
            scheduledAt: {
              ...formState.sessionLifecycle.scheduledAt,
              end: newNominationEndDate.toISOString()
            },
          },
        })
      }
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    if (date) {
      // Preserve the time when changing the date
      const currentTime = endTime.split(":")
      const hours = Number.parseInt(currentTime[0], 10)
      const minutes = Number.parseInt(currentTime[1], 10)
      const seconds = Number.parseInt(currentTime[2], 10)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, seconds)

      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          endedAt: newDate.toISOString(),
        },
      })
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setStartTime(timeValue)

    if (startDate && isValidTimeFormat(timeValue)) {
      const [hours, minutes, seconds] = timeValue.split(":").map(Number)
      const newDate = new Date(startDate)
      newDate.setHours(hours, minutes, seconds || 0)

      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          startedAt: newDate.toISOString(),
        },
      })
    }
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setEndTime(timeValue)

    if (endDate && isValidTimeFormat(timeValue)) {
      const [hours, minutes, seconds] = timeValue.split(":").map(Number)
      const newDate = new Date(endDate)
      newDate.setHours(hours, minutes, seconds || 0)

      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          endedAt: newDate.toISOString(),
        },
      })
    }
  }

  const handleNominationToggle = (checked: boolean) => {
    setNominationEnabled(checked)

    if (checked) {
      // If enabling nomination, set default dates if not already set
      if (!nominationStartDate) {
        const newStartDate = new Date()
        setNominationStartDate(newStartDate)
        setNominationStartTime("00:00:00")
      }

      if (!nominationEndDate && startDate) {
        const newEndDate = new Date(startDate)
        newEndDate.setHours(0, 0, 0, 0) // Beginning of the start date
        setNominationEndDate(newEndDate)
        setNominationEndTime("23:59:59")
      }

      // Update the form state
      updateFormState({
        candidateStep: "nomination",
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            start: nominationStartDate?.toISOString() || new Date().toISOString(),
            end: nominationEndDate?.toISOString() || startDate?.toISOString() || new Date().toISOString()
          },
        },
      })
    } else {
      updateFormState({
        candidateStep: "manual",
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            start: null,
            end: null
          },
        },
      })
    }
  }

  const handleNominationStartDateChange = (date: Date | undefined) => {
    setNominationStartDate(date)
    if (date) {
      // Preserve the time when changing the date
      const currentTime = nominationStartTime.split(":")
      const hours = Number.parseInt(currentTime[0], 10)
      const minutes = Number.parseInt(currentTime[1], 10)
      const seconds = Number.parseInt(currentTime[2], 10)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, seconds)

      // Update the form state
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            ...formState.sessionLifecycle.scheduledAt,
            start: newDate.toISOString(),
          },
        },
      })
    }
  }

  const handleNominationEndDateChange = (date: Date | undefined) => {
    setNominationEndDate(date)
    if (date) {
      // Preserve the time when changing the date
      const currentTime = nominationEndTime.split(":")
      const hours = Number.parseInt(currentTime[0], 10)
      const minutes = Number.parseInt(currentTime[1], 10)
      const seconds = Number.parseInt(currentTime[2], 10)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, seconds)

      // Update the form state with the end date
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            ...formState.sessionLifecycle.scheduledAt,
            end: newDate.toISOString(),
          },
        },
      })
    }
  }

  const handleNominationStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setNominationStartTime(timeValue)

    if (nominationStartDate && isValidTimeFormat(timeValue)) {
      const [hours, minutes, seconds] = timeValue.split(":").map(Number)
      const newDate = new Date(nominationStartDate)
      newDate.setHours(hours, minutes, seconds || 0)

      // Update the form state
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            ...formState.sessionLifecycle.scheduledAt,
            start: newDate.toISOString(),
          },
        },
      })
    }
  }

  const handleNominationEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setNominationEndTime(timeValue)
    
    if (nominationEndDate && isValidTimeFormat(timeValue)) {
      const [hours, minutes, seconds] = timeValue.split(":").map(Number)
      const newDate = new Date(nominationEndDate)
      newDate.setHours(hours, minutes, seconds || 0)

      // Update the form state
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            ...formState.sessionLifecycle.scheduledAt,
            end: newDate.toISOString(),
          },
        },
      })
    }
  }

  // Helper function to validate time format
  const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/
    return timeRegex.test(time)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Session Timeline</h3>

        <div className="grid grid-cols-1 gap-8">
          {/* Start Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date and Time</Label>
            <div className="grid grid-cols-1 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      dateErrors.startDate && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={handleStartDateChange} initialFocus />
                </PopoverContent>
              </Popover>

              <div className="relative w-full max-w-[300px]">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  placeholder="HH:MM:SS"
                  className={cn("pl-10", errors.startTime && "border-red-500")}
                  pattern="^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$"
                />
              </div>
            </div>
            {dateErrors.startDate && <p className="text-red-500 text-xs mt-1">{dateErrors.startDate}</p>}
            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
          </div>

          {/* End Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date and Time</Label>
            <div className="grid grid-cols-1 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      dateErrors.endDate && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={handleEndDateChange} initialFocus />
                </PopoverContent>
              </Popover>

              <div className="relative w-full max-w-[300px]">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  placeholder="HH:MM:SS"
                  className={cn("pl-10", errors.endTime && "border-red-500")}
                  pattern="^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$"
                />
              </div>
            </div>
            {dateErrors.endDate && <p className="text-red-500 text-xs mt-1">{dateErrors.endDate}</p>}
            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
          </div>
        </div>

        {dateErrors.endDate && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dateErrors.endDate}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Candidate Nomination Period (only for Election/Tournament) */}
      {showNomination && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Candidate Nomination Period</h3>
              <p className="text-sm text-muted-foreground">
                Allow participants to nominate candidates before voting begins
              </p>
            </div>
            <div className="flex items-center gap-2 relative">
              {!isPro && <ProFeatureBadge className="absolute right-14" />}
              <Switch checked={nominationEnabled} onCheckedChange={handleNominationToggle} disabled={!isPro} />
            </div>
          </div>

          {nominationEnabled && (
            <div className="grid grid-cols-1 gap-8 pt-2">
              {/* Nomination Start Date */}
              <div className="space-y-2">
                <Label htmlFor="nomination-start-date">Nomination Start Date</Label>
                <div className="grid grid-cols-1 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !nominationStartDate && "text-muted-foreground",
                          dateErrors.nominationStartDate && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nominationStartDate ? format(nominationStartDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={nominationStartDate}
                        onSelect={handleNominationStartDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="relative w-full max-w-[300px]">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={nominationStartTime}
                      onChange={handleNominationStartTimeChange}
                      placeholder="HH:MM:SS"
                      className="pl-10"
                      pattern="^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$"
                    />
                  </div>
                </div>
                {dateErrors.nominationStartDate && (
                  <p className="text-red-500 text-xs mt-1">{dateErrors.nominationStartDate}</p>
                )}
              </div>

              {/* Nomination End Date */}
              <div className="space-y-2">
                <Label htmlFor="nomination-end-date">Nomination End Date</Label>
                <div className="grid grid-cols-1 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !nominationEndDate && "text-muted-foreground",
                          dateErrors.nominationEndDate && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nominationEndDate ? format(nominationEndDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={nominationEndDate}
                        onSelect={handleNominationEndDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="relative w-full max-w-[300px]">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={nominationEndTime}
                      onChange={handleNominationEndTimeChange}
                      placeholder="HH:MM:SS"
                      className="pl-10"
                      pattern="^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$"
                    />
                  </div>
                </div>
                {dateErrors.nominationEndDate && (
                  <p className="text-red-500 text-xs mt-1">{dateErrors.nominationEndDate}</p>
                )}
              </div>
            </div>
          )}

          {nominationEnabled && dateErrors.nominationEndDate && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dateErrors.nominationEndDate}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
