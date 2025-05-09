"use client"

import { useState, useEffect } from "react"
import { format, isAfter, addDays } from "date-fns"
import { CalendarIcon, Clock, AlertCircle,Info } from "lucide-react"
import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {  CardContent} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Types from original component
interface LifecycleStepProps {
  formState: SessionFormState;
  updateFormState: (newState: Partial<SessionFormState>) => void;
  errors?: Record<string, string>;
}

export default function LifecycleStep({ formState, updateFormState, errors = {} }: LifecycleStepProps) {
  // State management
  const [startDate, setStartDate] = useState<Date | undefined>(
      formState.sessionLifecycle.startedAt ? new Date(formState.sessionLifecycle.startedAt) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
      formState.sessionLifecycle.endedAt ? new Date(formState.sessionLifecycle.endedAt) : undefined
  )
  const [startTime, setStartTime] = useState(startDate ? format(startDate, "HH:mm:ss") : "00:00:00")
  const [endTime, setEndTime] = useState(endDate ? format(endDate, "HH:mm:ss") : "23:59:59")

  const [nominationEnabled, setNominationEnabled] = useState(formState.candidateStep === "nomination")
  const [requirePapers, setRequirePapers] = useState(formState.requirePapers || false)
  const [nominationStartDate, setNominationStartDate] = useState<Date | undefined>(
      formState.sessionLifecycle.scheduledAt.start ? new Date(formState.sessionLifecycle.scheduledAt.start) : new Date()
  )
  const [nominationEndDate, setNominationEndDate] = useState<Date | undefined>(
      formState.sessionLifecycle.scheduledAt.end
          ? new Date(formState.sessionLifecycle.scheduledAt.end)
          : startDate
              ? new Date(startDate)
              : addDays(new Date(), 1)
  )
  const [nominationStartTime, setNominationStartTime] = useState(
      nominationStartDate ? format(nominationStartDate, "HH:mm:ss") : "00:00:00"
  )
  const [nominationEndTime, setNominationEndTime] = useState(
      nominationEndDate ? format(nominationEndDate, "HH:mm:ss") : "23:59:59"
  )

  // Validation state
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({})
  const [isNominationExpanded, setIsNominationExpanded] = useState(true)

  // Feature flags
  const isPro = formState.subscription.name === "pro" || formState.subscription.name === "enterprise"
  const showNomination = formState.type === "election" || formState.type === "tournament"

  // Date validation
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    if (startDate && endDate) {
      if (isAfter(startDate, endDate)) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    if (nominationEnabled && nominationStartDate && nominationEndDate) {
      if (isAfter(nominationStartDate, nominationEndDate)) {
        newErrors.nominationEndDate = "Nomination end date must be after start date"
      }

      if (startDate && isAfter(nominationEndDate, startDate)) {
        newErrors.nominationEndDate = "Nomination period must end before voting starts"
      }
    }

    setDateErrors(newErrors)
  }, [startDate, endDate, nominationStartDate, nominationEndDate, nominationEnabled])

  // Date and time helpers
  const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/
    return timeRegex.test(time)
  }

  const applyTimeToDate = (date: Date, timeStr: string): Date => {
    if (date && isValidTimeFormat(timeStr)) {
      const [hours, minutes, seconds] = timeStr.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, seconds || 0)
      return newDate
    }
    return date
  }

  // Handlers for main session period
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    if (date) {
      const newDate = applyTimeToDate(date, startTime)
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          startedAt: newDate.toISOString(),
        },
      })

      // Update nomination end date if needed
      if (nominationEnabled && (!nominationEndDate || isAfter(nominationEndDate, newDate))) {
        const newNominationEndDate = new Date(newDate)
        newNominationEndDate.setHours(0, 0, 0, 0)
        setNominationEndDate(newNominationEndDate)

        updateFormState({
          sessionLifecycle: {
            ...formState.sessionLifecycle,
            scheduledAt: {
              ...formState.sessionLifecycle.scheduledAt,
              end: newNominationEndDate.toISOString(),
            },
          },
        })
      }
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    if (date) {
      const newDate = applyTimeToDate(date, endTime)
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
      const newDate = applyTimeToDate(startDate, timeValue)
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
      const newDate = applyTimeToDate(endDate, timeValue)
      updateFormState({
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          endedAt: newDate.toISOString(),
        },
      })
    }
  }

  // Handlers for nomination period
  const handleNominationToggle = (checked: boolean) => {
    setNominationEnabled(checked)
    setIsNominationExpanded(checked)

    if (checked) {
      // Set default dates if needed
      const newStartDate = nominationStartDate || new Date()
      const newEndDate = nominationEndDate ||
          (startDate ? new Date(startDate) : addDays(new Date(), 1))

      setNominationStartDate(newStartDate)
      setNominationEndDate(newEndDate)

      const formattedStartDate = applyTimeToDate(newStartDate, nominationStartTime || "00:00:00")
      const formattedEndDate = applyTimeToDate(newEndDate, nominationEndTime || "23:59:59")

      updateFormState({
        candidateStep: "nomination",
        sessionLifecycle: {
          ...formState.sessionLifecycle,
          scheduledAt: {
            start: formattedStartDate.toISOString(),
            end: formattedEndDate.toISOString()
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
      const newDate = applyTimeToDate(date, nominationStartTime)
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
      const newDate = applyTimeToDate(date, nominationEndTime)
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
      const newDate = applyTimeToDate(nominationStartDate, timeValue)
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
      const newDate = applyTimeToDate(nominationEndDate, timeValue)
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

  // Add handler for require papers toggle
  const handleRequirePapersToggle = (checked: boolean) => {
    setRequirePapers(checked)
    updateFormState({ requirePapers: checked })
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Main Session Period */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Session Period</h3>
        <p className="text-muted-foreground">Set when voting will start and end</p>

        {/* Display errors from parent component */}
        {(errors.startDate || errors.endDate || errors.dateRange) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errors.startDate || errors.endDate || errors.dateRange}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="start-date" className="text-base font-medium">Start Date & Time</Label>
              {dateErrors.startDate && (
                  <Badge variant="destructive" className="text-xs py-0">Invalid</Badge>
              )}
            </div>

            <div className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                          dateErrors.startDate && "border-red-500 ring-red-500"
                      )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                    id="start-time"
                    type="text"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    placeholder="HH:MM:SS"
                    className={cn(
                        "pl-10",
                        errors.startTime && "border-red-500",
                        "transition-all focus-visible:ring-2"
                    )}
                    aria-label="Start time"
                    aria-invalid={!!errors.startTime}
                    aria-errormessage={errors.startTime ? "start-time-error" : undefined}
                />
              </div>

              {(errors.startTime || dateErrors.startDate) && (
                  <p id="start-time-error" className="text-red-500 text-xs">
                    {errors.startTime || dateErrors.startDate}
                  </p>
              )}
            </div>
          </div>

          {/* End Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="end-date" className="text-base font-medium">End Date & Time</Label>
              {dateErrors.endDate && (
                  <Badge variant="destructive" className="text-xs py-0">Invalid</Badge>
              )}
            </div>

            <div className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                          dateErrors.endDate && "border-red-500 ring-red-500"
                      )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateChange}
                      initialFocus
                      disabled={(date) => startDate ? date < startDate : date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                    id="end-time"
                    type="text"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    placeholder="HH:MM:SS"
                    className={cn(
                        "pl-10",
                        errors.endTime && "border-red-500",
                        "transition-all focus-visible:ring-2"
                    )}
                    aria-label="End time"
                    aria-invalid={!!errors.endTime}
                    aria-errormessage={errors.endTime ? "end-time-error" : undefined}
                />
              </div>

              {(errors.endTime || dateErrors.endDate) && (
                  <p id="end-time-error" className="text-red-500 text-xs">
                    {errors.endTime || dateErrors.endDate}
                  </p>
              )}
            </div>
          </div>
        </div>

        {dateErrors.endDate && (
            <Alert variant="destructive" className="mt-6 animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dateErrors.endDate}</AlertDescription>
            </Alert>
        )}
      </div>

      {/* Nomination Period (only for election or tournament) */}
      {showNomination && (
        <div className="space-y-4 border-t pt-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Candidate Nomination</h3>
              <p className="text-muted-foreground">Allow users to apply as candidates</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="nomination-toggle"
                checked={nominationEnabled}
                onCheckedChange={handleNominationToggle}
              />
              <Label htmlFor="nomination-toggle">Enable</Label>
            </div>
          </div>

          {/* Display nomination-specific errors */}
          {nominationEnabled && (errors.nominationStart || errors.nominationEnd || errors.nominationDates) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.nominationStart || errors.nominationEnd || errors.nominationDates}
              </AlertDescription>
            </Alert>
          )}

          {/* Collapsible nomination settings content */}
          {nominationEnabled && isNominationExpanded && (
              <CardContent className="pt-6 animate-in fade-in slide-in-from-top-5 duration-300">
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Nomination Start Date and Time */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="nomination-start-date" className="text-base font-medium">
                        Nomination Start
                      </Label>
                      {dateErrors.nominationStartDate && (
                          <Badge variant="destructive" className="text-xs py-0">Invalid</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !nominationStartDate && "text-muted-foreground",
                                  dateErrors.nominationStartDate && "border-red-500"
                              )}
                          >
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {nominationStartDate ? format(nominationStartDate, "PPP") : "Select date"}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                              mode="single"
                              selected={nominationStartDate}
                              onSelect={handleNominationStartDateChange}
                              initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                            type="text"
                            value={nominationStartTime}
                            onChange={handleNominationStartTimeChange}
                            placeholder="HH:MM:SS"
                            className="pl-10"
                            aria-label="Nomination start time"
                        />
                      </div>

                      {dateErrors.nominationStartDate && (
                          <p className="text-red-500 text-xs">{dateErrors.nominationStartDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Nomination End Date and Time */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="nomination-end-date" className="text-base font-medium">
                        Nomination End
                      </Label>
                      {dateErrors.nominationEndDate && (
                          <Badge variant="destructive" className="text-xs py-0">Invalid</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !nominationEndDate && "text-muted-foreground",
                                  dateErrors.nominationEndDate && "border-red-500"
                              )}
                          >
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {nominationEndDate ? format(nominationEndDate, "PPP") : "Select date"}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                              mode="single"
                              selected={nominationEndDate}
                              onSelect={handleNominationEndDateChange}
                              initialFocus
                              disabled={(date) => nominationStartDate ? date < nominationStartDate : false}
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                            type="text"
                            value={nominationEndTime}
                            onChange={handleNominationEndTimeChange}
                            placeholder="HH:MM:SS"
                            className="pl-10"
                            aria-label="Nomination end time"
                        />
                      </div>

                      {dateErrors.nominationEndDate && (
                          <p className="text-red-500 text-xs">{dateErrors.nominationEndDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {dateErrors.nominationEndDate && (
                    <Alert variant="destructive" className="mt-6 animate-in fade-in">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{dateErrors.nominationEndDate}</AlertDescription>
                    </Alert>
                )}

                {/* Add the require papers toggle */}
                <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Require Supporting Documents</h4>
                      <p className="text-sm text-muted-foreground">
                        Require candidates to upload supporting documents or papers when nominating
                      </p>
                    </div>
                    <Switch
                      checked={requirePapers}
                      onCheckedChange={handleRequirePapersToggle}
                      aria-label="Require supporting papers"
                    />
                  </div>
                </div>

                <div className="mt-6 p-3 bg-primary/5 rounded-lg">
                  <div className="flex gap-2 items-start">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      The nomination period must end before the voting session begins. Participants can suggest candidates during this period.
                    </p>
                  </div>
                </div>
              </CardContent>
          )}
        </div>
      )}
    </div>
  )
}