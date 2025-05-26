"use client"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  disabled?: boolean
  label?: string
  description?: string
}

export function DatePickerWithRange({
  className,
  dateRange,
  setDateRange,
  disabled = false,
  label,
  description
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <div className="text-sm font-medium">{label}</div>}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={disabled ? "outline" : "default"}
            className={cn(
              "w-full justify-start text-left font-normal", 
              !dateRange && "text-muted-foreground",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => range && setDateRange(range)}
            numberOfMonths={2}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Simple date display component for the timeline
export function DateDisplay({ date, label }: { date: Date | string | null | undefined, label?: string }) {
  if (!date) return <span className="text-xs text-muted-foreground">Not set</span>;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return (
      <div className="space-y-0.5">
        {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
        <div className="text-sm">{format(dateObj, "MMM dd, yyyy")}</div>
        <div className="text-xs text-muted-foreground">{format(dateObj, "h:mm a")}</div>
      </div>
    );
  } catch (e) {
    return <span className="text-xs text-muted-foreground">Invalid date</span>;
  }
}
