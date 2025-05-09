"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CountdownTimerProps {
  sessionLifecycle: {
    createdAt: string;
    scheduledAt?: {
      start: string | null;
      end: string | null;
    } | null;
    startedAt: string;
    endedAt: string;
  };
  status?: string;
}

export function CountdownTimer({ sessionLifecycle, status }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [sessionState, setSessionState] = useState<'not_started' | 'active' | 'ended'>('active')
  const [targetDate, setTargetDate] = useState<Date>(new Date())
  const [countdownLabel, setCountdownLabel] = useState<string>("Session Ends In")

  useEffect(() => {
    // Determine session state and target date for countdown
    const now = new Date()
    const startDate = sessionLifecycle.scheduledAt?.start 
      ? new Date(sessionLifecycle.scheduledAt.start) 
      : new Date(sessionLifecycle.startedAt)
    const endDate = new Date(sessionLifecycle.endedAt)
    
    if (now < startDate) {
      setSessionState('not_started')
      setTargetDate(startDate)
      setCountdownLabel("Session Starts In")
    } else if (now < endDate) {
      setSessionState('active')
      setTargetDate(endDate)
      setCountdownLabel("Session Ends In")
    } else {
      setSessionState('ended')
      setTargetDate(endDate)
      setCountdownLabel("Session Ended")
    }
  }, [sessionLifecycle])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        // If countdown is complete, check if we need to update session state
        if (sessionState === 'not_started') {
          setSessionState('active')
          setTargetDate(new Date(sessionLifecycle.endedAt))
          setCountdownLabel("Session Ends In")
        } else if (sessionState === 'active') {
          setSessionState('ended')
        }
        
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, sessionState, sessionLifecycle])

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {countdownLabel}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {sessionState === 'not_started' && (
            <>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                Not Started
              </Badge>
              <span>Session scheduled to start soon</span>
            </>
          )}
          {sessionState === 'active' && (
            <>
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                Active
              </Badge>
              <span>Voting is currently active</span>
            </>
          )}
          {sessionState === 'ended' && (
            <>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                Ended
              </Badge>
              <span>Voting has ended</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground">Days</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeLeft.hours}</span>
            <span className="text-xs text-muted-foreground">Hours</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeLeft.minutes}</span>
            <span className="text-xs text-muted-foreground">Minutes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeLeft.seconds}</span>
            <span className="text-xs text-muted-foreground">Seconds</span>
          </div>
        </div>
        
        <div className="text-xs border-t pt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(sessionLifecycle.createdAt)}</span>
          </div>
          {sessionLifecycle.scheduledAt?.start && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled Start:</span>
              <span>{formatDate(sessionLifecycle.scheduledAt.start)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Started:</span>
            <span>{formatDate(sessionLifecycle.startedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ends:</span>
            <span>{formatDate(sessionLifecycle.endedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
