"use client"

import { useState } from "react"
import { X, Download, FileText, ImageIcon, File, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import type { Candidate } from "./data"

interface CandidateDialogProps {
  candidate: Candidate
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
}

export function CandidateDialog({ 
  candidate, 
  open, 
  onOpenChange,
  onAccept,
  onReject
}: CandidateDialogProps) {
  const [activeTab, setActiveTab] = useState<"info" | "attachments">("info")
  const [isProcessing, setIsProcessing] = useState(false)

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()

    if (extension === "pdf") return <FileText className="h-5 w-5 text-red-500" />
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) return <ImageIcon className="h-5 w-5 text-blue-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const handleAccept = async () => {
    if (!onAccept || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Call the accept handler
      onAccept(candidate.id);
      
      // Close the dialog
      onOpenChange(false);
    } finally {
      // We'll set processing back to false after a delay
      // This prevents rapid clicking even after the dialog closes
      setTimeout(() => setIsProcessing(false), 1000);
    }
  }

  const handleReject = async () => {
    if (!onReject || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Call the reject handler
      onReject(candidate.id);
      
      // Close the dialog
      onOpenChange(false);
    } finally {
      // We'll set processing back to false after a delay
      // This prevents rapid clicking even after the dialog closes
      setTimeout(() => setIsProcessing(false), 1000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Candidate Details</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p>{candidate.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{candidate.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{candidate.dateOfBirth}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Place of Birth</p>
                  <p>{candidate.placeOfBirth}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nationalities</p>
                  <p>{candidate.nationalities.join(", ")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={candidate.status} />
                </div>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />
          <Separator className="md:hidden" />

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Details</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Experience</p>
                <p>{candidate.experience}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Biography</p>
                <p className="text-sm">{candidate.biography}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Candidate Promises</h3>
              <ul className="list-disc pl-5 space-y-2">
                {candidate.promises.map((promise, index) => (
                  <li key={index} className="text-sm">
                    {promise}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Attachments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidate.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.name)}
                  <div>
                    <p className="font-medium text-sm">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{attachment.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Download">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons for pending candidates */}
        {candidate.status === "pending" && (onAccept || onReject) && (
          <div className="flex justify-end gap-4 mt-6">
            {onReject && (
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Reject Candidate"}
              </Button>
            )}
            {onAccept && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Accept Candidate"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
