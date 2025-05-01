"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn-ui/alert-dialog"
import { Play, Square, Trash } from "lucide-react"
import type { SessionType } from "./vote-session-management"
import { toast } from "@/hooks/use-toast"

interface SessionActionsProps {
  sessionType: SessionType
  onStartSession: () => void
  onStopSession: () => void
  onDeleteSession: () => void
}

export function SessionActions({ sessionType, onStartSession, onStopSession, onDeleteSession }: SessionActionsProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleStartSession = () => {
    onStartSession()
    setIsRunning(true)
    setIsStartDialogOpen(false)
    toast({
      title: "Session started",
      description: `Your ${sessionType.toLowerCase()} session has been started successfully.`,
    })
  }

  const handleStopSession = () => {
    onStopSession()
    setIsRunning(false)
    setIsStopDialogOpen(false)
    toast({
      title: "Session stopped",
      description: `Your ${sessionType.toLowerCase()} session has been stopped.`,
    })
  }

  const handleDeleteSession = () => {
    onDeleteSession()
    setIsDeleteDialogOpen(false)
    toast({
      title: "Session deleted",
      description: `Your ${sessionType.toLowerCase()} session has been deleted.`,
      variant: "destructive",
    })
  }

  return (
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-2 z-10">
        {!isRunning ? (
            <AlertDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className="gap-1">
              <Play className="h-4 w-4" />
              Start Session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make the {sessionType.toLowerCase()} session live and accessible to voters. Make sure all your
                settings are correct before proceeding.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartSession}>Start Session</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-1">
              <Square className="h-4 w-4" />
              Stop Session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stop this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately end the {sessionType.toLowerCase()} session and prevent any further voting.
                Results will be finalized based on current votes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStopSession}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Stop Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="gap-1">
            <Trash className="h-4 w-4" />
            Delete Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              {sessionType.toLowerCase()} session and all associated data including votes and candidates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
