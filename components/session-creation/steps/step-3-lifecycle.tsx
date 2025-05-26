"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { FormData } from "../voting-session-form"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { TimePickerDemo } from "../time-picker"

interface Step3Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

export default function Step3Lifecycle({ formData, updateFormData }: Step3Props) {
  // Use local state only for UI purposes, not for data management
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.startDate ? new Date(formData.startDate) : new Date(),
  )
  const [endDate, setEndDate] = useState<Date | undefined>(formData.endDate ? new Date(formData.endDate) : new Date())
  const [nominationStartDate, setNominationStartDate] = useState<Date | undefined>(
    formData.nominationStartDate ? new Date(formData.nominationStartDate) : new Date(),
  )
  const [nominationEndDate, setNominationEndDate] = useState<Date | undefined>(
    formData.nominationEndDate ? new Date(formData.nominationEndDate) : undefined,
  )

  // Sync local state with form data when it changes externally
  useEffect(() => {
    if (formData.startDate && (!startDate || formData.startDate.getTime() !== startDate.getTime())) {
      setStartDate(new Date(formData.startDate))
    }
    if (formData.endDate && (!endDate || formData.endDate.getTime() !== endDate.getTime())) {
      setEndDate(new Date(formData.endDate))
    }
    if (
      formData.nominationStartDate &&
      (!nominationStartDate || formData.nominationStartDate.getTime() !== nominationStartDate.getTime())
    ) {
      setNominationStartDate(new Date(formData.nominationStartDate))
    }
    if (
      formData.nominationEndDate &&
      (!nominationEndDate || formData.nominationEndDate.getTime() !== nominationEndDate.getTime())
    ) {
      setNominationEndDate(new Date(formData.nominationEndDate))
    }
    
    // Initialize with current time if not already set
    if (!formData.startDate) {
      const now = new Date()
      updateFormData({ startDate: now })
    }
    if (!formData.endDate) {
      const now = new Date()
      now.setDate(now.getDate() + 7) // Default to a week later
      updateFormData({ endDate: now })
    }
    
    // For election type, ensure nomination dates are set
    if (formData.voteType === "election") {
      // Set hasNomination to true for elections
      if (!formData.hasNomination) {
        updateFormData({ hasNomination: true })
      }
      
      // Set nomination start date if not already set
      if (!formData.nominationStartDate) {
        const now = new Date()
        updateFormData({ nominationStartDate: now })
        setNominationStartDate(now)
      }
      
      // Set nomination end date if not already set
      if (!formData.nominationEndDate) {
        const nominationEnd = new Date()
        nominationEnd.setDate(nominationEnd.getDate() + 3) // Default to 3 days later
        updateFormData({ nominationEndDate: nominationEnd })
        setNominationEndDate(nominationEnd)
        
        // Also update voting start date to be after nomination end
        const votingStart = new Date(nominationEnd)
        votingStart.setDate(votingStart.getDate() + 1) // Start voting 1 day after nomination ends
        updateFormData({ startDate: votingStart })
        setStartDate(votingStart)
      }
    }
  }, [formData])

  // Validate and enforce date ordering
  useEffect(() => {
    if (formData.voteType === "election") {
      // For elections, enforce that nomination ends before voting starts
      if (nominationEndDate && startDate && nominationEndDate >= startDate) {
        // Set voting start to day after nomination ends
        const newStart = new Date(nominationEndDate)
        newStart.setDate(newStart.getDate() + 1)
        updateFormData({ startDate: newStart })
      }
      
      // Ensure nomination start is before nomination end
      if (nominationStartDate && nominationEndDate && nominationStartDate >= nominationEndDate) {
        // Set nomination end to day after nomination start
        const newEnd = new Date(nominationStartDate)
        newEnd.setDate(newEnd.getDate() + 1)
        updateFormData({ nominationEndDate: newEnd })
      }
    }
    
    // For all session types, ensure start is before end
    if (startDate && endDate && startDate >= endDate) {
      // Set end date to day after start
      const newEnd = new Date(startDate)
      newEnd.setDate(newEnd.getDate() + 1)
      updateFormData({ endDate: newEnd })
    }
  }, [formData.voteType, nominationStartDate, nominationEndDate, startDate, endDate])

  const handleQuickSelect = (type: string, field: "start" | "end" | "nominationStart" | "nominationEnd") => {
    const now = new Date()
    const date = new Date()

    switch (type) {
      case "now":
        date.setTime(now.getTime())
        break
      case "tomorrow":
        date.setDate(now.getDate() + 1)
        break
      case "nextweek":
        date.setDate(now.getDate() + 7)
        break
      case "1week":
        date.setDate(now.getDate() + 7)
        break
      case "2weeks":
        date.setDate(now.getDate() + 14)
        break
      case "1month":
        date.setMonth(now.getMonth() + 1)
        break
    }

    // Update both local state and form data in one go
    switch (field) {
      case "start":
        setStartDate(date)
        updateFormData({ startDate: date })
        break
      case "end":
        setEndDate(date)
        updateFormData({ endDate: date })
        break
      case "nominationStart":
        setNominationStartDate(date)
        updateFormData({ nominationStartDate: date })
        break
      case "nominationEnd":
        setNominationEndDate(date)
        updateFormData({ nominationEndDate: date })
        break
    }
  }

  // Helper function to update both local state and form data
  const updateDateAndFormData = (
    date: Date | undefined,
    setDateFn: React.Dispatch<React.SetStateAction<Date | undefined>>,
    formDataKey: keyof Pick<FormData, "startDate" | "endDate" | "nominationStartDate" | "nominationEndDate">,
  ) => {
    if (date) {
      setDateFn(date)
      updateFormData({ [formDataKey]: date } as any)
      
      // Enforce date ordering when dates are updated
      if (formDataKey === "nominationStartDate" && formData.nominationEndDate) {
        if (date >= formData.nominationEndDate) {
          const newEnd = new Date(date)
          newEnd.setDate(newEnd.getDate() + 1)
          updateFormData({ nominationEndDate: newEnd })
        }
      } 
      else if (formDataKey === "nominationEndDate" && formData.startDate) {
        if (date >= formData.startDate) {
          const newStart = new Date(date)
          newStart.setDate(newStart.getDate() + 1)
          updateFormData({ startDate: newStart })
        }
      }
      else if (formDataKey === "startDate" && formData.endDate) {
        if (date >= formData.endDate) {
          const newEnd = new Date(date)
          newEnd.setDate(newEnd.getDate() + 1)
          updateFormData({ endDate: newEnd })
        }
      }
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 pb-4 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">Schedule Your Session</h2>
        <p className="text-muted-foreground text-sm mt-1">Set when your voting or nomination periods should occur</p>
      </div>

      {formData.voteType === "election" && (
        <div className="mb-8">
          <div className="flex items-center p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <div className="font-medium text-foreground">
              Nomination Phase
            </div>
            <div className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Required for Elections
            </div>
          </div>
          
          <div className="mb-8">
            <div className="mb-8 relative">
              <div className="bg-card rounded-xl shadow-sm border border-border p-3 sm:p-5">
                <h3 className="font-medium text-foreground mb-4 flex flex-wrap items-center gap-2">
                  <span className="mr-2">Nomination Period</span>
                  <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">First Phase</div>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-sm font-medium block mb-2">Start Date & Time</Label>
                    <div className="flex flex-col gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal hover:bg-primary/5",
                              !nominationStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {nominationStartDate ? format(nominationStartDate, "PPP") : <span>Select start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 min-w-[280px]" align="start" side="bottom" sideOffset={4}>
                          <Calendar
                            mode="single"
                            selected={nominationStartDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date)
                                if (nominationStartDate) {
                                  newDate.setHours(nominationStartDate.getHours())
                                  newDate.setMinutes(nominationStartDate.getMinutes())
                                }
                                updateDateAndFormData(newDate, setNominationStartDate, "nominationStartDate")
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {nominationStartDate && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <TimePickerDemo
                            date={nominationStartDate}
                            setDate={(date) => updateDateAndFormData(date, setNominationStartDate, "nominationStartDate")}
                            className="flex-1 w-full min-w-0"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleQuickSelect("1day", "nominationStart")}
                          className="text-xs h-7 bg-muted/50 hover:bg-muted"
                        >
                          Tomorrow
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleQuickSelect("1week", "nominationStart")}
                          className="text-xs h-7 bg-muted/50 hover:bg-muted"
                        >
                          Next week
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium block mb-2">End Date & Time</Label>
                    <div className="flex flex-col gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal hover:bg-primary/5",
                              !nominationEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {nominationEndDate ? format(nominationEndDate, "PPP") : <span>Select end date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 min-w-[280px]" align="start" side="bottom" sideOffset={4}>
                          <Calendar
                            mode="single"
                            selected={nominationEndDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date)
                                if (nominationEndDate) {
                                  newDate.setHours(nominationEndDate.getHours())
                                  newDate.setMinutes(nominationEndDate.getMinutes())
                                }
                                updateDateAndFormData(newDate, setNominationEndDate, "nominationEndDate")
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {nominationEndDate && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-primary" />
                          <TimePickerDemo
                            date={nominationEndDate}
                            setDate={(date) => updateDateAndFormData(date, setNominationEndDate, "nominationEndDate")}
                            className="flex-1"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleQuickSelect("1week", "nominationEnd")}
                          className="text-xs h-7 bg-muted/50 hover:bg-muted"
                        >
                          1 week
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleQuickSelect("2weeks", "nominationEnd")}
                          className="text-xs h-7 bg-muted/50 hover:bg-muted"
                        >
                          2 weeks
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-8 relative">
          <div className="bg-card rounded-xl shadow-sm border border-border p-3 sm:p-5">
            <h3 className="font-medium text-foreground mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-2">{formData.voteType === "poll" ? "Poll" : "Voting"} Period</span>
              <div className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                {formData.voteType === "election" && formData.hasNomination ? "Second Phase" : "Main Phase"}
              </div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-sm font-medium block mb-2">Start Date & Time</Label>
                <div className="flex flex-col gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal hover:bg-primary/5",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {startDate ? format(startDate, "PPP") : <span>Select start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 min-w-[280px]" align="start" side="bottom" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date)
                            if (startDate) {
                              newDate.setHours(startDate.getHours())
                              newDate.setMinutes(startDate.getMinutes())
                            }
                            updateDateAndFormData(newDate, setStartDate, "startDate")
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {startDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-primary" />
                      <TimePickerDemo
                        date={startDate}
                        setDate={(date) => updateDateAndFormData(date, setStartDate, "startDate")}
                        className="flex-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleQuickSelect("tomorrow", "start")}
                      className="text-xs h-7 bg-muted/50 hover:bg-muted"
                    >
                      Tomorrow
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleQuickSelect("nextweek", "start")}
                      className="text-xs h-7 bg-muted/50 hover:bg-muted"
                    >
                      Next week
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium block mb-2">End Date & Time</Label>
                <div className="flex flex-col gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal hover:bg-primary/5",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {endDate ? format(endDate, "PPP") : <span>Select end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 min-w-[280px]" align="start" side="bottom" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date)
                            if (endDate) {
                              newDate.setHours(endDate.getHours())
                              newDate.setMinutes(endDate.getMinutes())
                            }
                            updateDateAndFormData(newDate, setEndDate, "endDate")
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {endDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-primary" />
                      <TimePickerDemo
                        date={endDate}
                        setDate={(date) => updateDateAndFormData(date, setEndDate, "endDate")}
                        className="flex-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleQuickSelect("1week", "end")}
                      className="text-xs h-7 bg-muted/50 hover:bg-muted font-medium"
                    >
                      1 week
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleQuickSelect("2weeks", "end")}
                      className="text-xs h-7 bg-muted/50 hover:bg-muted font-medium"
                    >
                      2 weeks
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {startDate && endDate && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mt-6">
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Voting Duration</p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>

          {formData.voteType === "election" && formData.hasNomination && nominationStartDate && nominationEndDate && (
            <>
              <div className="hidden md:block h-10 w-px bg-border/50"></div>
              <div className="flex items-center gap-3">
                <div className="size-9 sm:size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nomination Period</p>
                  <p className="text-lg sm:text-xl font-semibold text-foreground">
                    {Math.ceil((nominationEndDate.getTime() - nominationStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            </>
          )}
          
          <div className="hidden md:block h-10 w-px bg-border/50 md:ml-auto"></div>
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CalendarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Campaign</p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                {formData.voteType === "election" && formData.hasNomination && nominationStartDate
                  ? Math.ceil((endDate.getTime() - nominationStartDate.getTime()) / (1000 * 60 * 60 * 24))
                  : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                } days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
