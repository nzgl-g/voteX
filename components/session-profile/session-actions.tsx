"use client"

import { Button } from "@/components/shadcn-ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn-ui/alert-dialog"
import { PlayIcon, MonitorStopIcon as StopIcon, TrashIcon, MoreHorizontalIcon } from "lucide-react"
import { useState } from "react"

interface SessionActionsProps {
  sessionStatus: "scheduled" | "active" | "ended"
  onAction: (action: "start" | "stop" | "delete") => void
}

export function SessionActions({ sessionStatus, onAction }: SessionActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <div className="flex items-center space-x-2">
        {sessionStatus === "scheduled" && (
          <Button
            onClick={() => onAction("start")}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            <PlayIcon className="h-4 w-4" />
            Start Session
          </Button>
        )}

        {sessionStatus === "active" && (
          <Button onClick={() => onAction("stop")} variant="destructive" size="sm" className="gap-2">
            <StopIcon className="h-4 w-4" />
            End Session
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-600 cursor-pointer"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onAction("delete")} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
