"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function TimePickerDemo({
  date,
  setDate,
  className
}: {
  date: Date | undefined
  setDate: (date: Date) => void
  className?: string
}) {
  const minuteRef = React.useRef<HTMLInputElement>(null)
  const hourRef = React.useRef<HTMLInputElement>(null)
  const secondRef = React.useRef<HTMLInputElement>(null)

  const [hour, setHour] = React.useState<number>(date ? date.getHours() : 0)
  const [minute, setMinute] = React.useState<number>(date ? date.getMinutes() : 0)
  const [second, setSecond] = React.useState<number>(date ? date.getSeconds() : 0)

  React.useEffect(() => {
    if (date) {
      setHour(date.getHours())
      setMinute(date.getMinutes())
      setSecond(date.getSeconds())
    }
  }, [date])

  function handleTimeChange(time: number, type: string) {
    if (!date) return

    const newDate = new Date(date)

    if (type === "hour") {
      newDate.setHours(time)
    } else if (type === "minute") {
      newDate.setMinutes(time)
    } else if (type === "second") {
      newDate.setSeconds(time)
    }

    setDate(newDate)
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="flex items-center gap-x-1 text-sm">
        <div className="relative flex items-center">
          <Input
            ref={hourRef}
            type="number"
            min={0}
            max={23}
            placeholder="HH"
            value={hour}
            onChange={(e) => {
              if (+e.target.value > 23) setHour(23)
              else setHour(+e.target.value)
              handleTimeChange(+e.target.value || 0, "hour")
            }}
            className="w-12 h-8 px-2 rounded-md border-input focus:border-primary focus:ring-0"
          />
        </div>
        :
        <div className="relative flex items-center">
          <Input
            ref={minuteRef}
            type="number"
            min={0}
            max={59}
            placeholder="MM"
            value={minute}
            onChange={(e) => {
              if (+e.target.value > 59) setMinute(59)
              else setMinute(+e.target.value)
              handleTimeChange(+e.target.value || 0, "minute")
            }}
            className="w-12 h-8 px-2 rounded-md border-input focus:border-primary focus:ring-0"
          />
        </div>
        :
        <div className="relative flex items-center">
          <Input
            ref={secondRef}
            type="number"
            min={0}
            max={59}
            placeholder="SS"
            value={second}
            onChange={(e) => {
              if (+e.target.value > 59) setSecond(59)
              else setSecond(+e.target.value)
              handleTimeChange(+e.target.value || 0, "second")
            }}
            className="w-12 h-8 px-2 rounded-md border-input focus:border-primary focus:ring-0"
          />
        </div>
      </div>
    </div>
  )
}
