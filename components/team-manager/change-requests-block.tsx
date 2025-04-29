"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { ScrollArea } from "@/components/shadcn-ui/scroll-area"
import { Badge } from "@/components/shadcn-ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn-ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Input } from "@/components/shadcn-ui/input"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Label } from "@/components/shadcn-ui/label"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChangeRequest {
  id: string
  type: string
  title: string
  description: string
  requestedBy: {
    id: string
    fullName: string
  }
  status: "pending" | "approved" | "rejected"
  createdAt: Date
}

interface ChangeRequestsBlockProps {
  requests: ChangeRequest[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCreateRequest: (type: string, title: string, description: string) => void
  canEditDirectly: boolean
  currentUserRole: string
}

export function ChangeRequestsBlock({
  requests,
  onApprove,
  onReject,
  onCreateRequest,
  canEditDirectly,
  currentUserRole,
}: ChangeRequestsBlockProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [requestType, setRequestType] = useState("settings")
  const [requestTitle, setRequestTitle] = useState("")
  const [requestDescription, setRequestDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (requestTitle && requestDescription) {
      onCreateRequest(requestType, requestTitle, requestDescription)
      setRequestType("settings")
      setRequestTitle("")
      setRequestDescription("")
      setIsCreateModalOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const otherRequests = requests.filter((req) => req.status !== "pending")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Change Requests</CardTitle>
          <CardDescription>
            {canEditDirectly ? "Manage change requests from team members" : "Request changes to team settings"}
          </CardDescription>
        </div>
        {!canEditDirectly && currentUserRole !== "Leader" && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>New Request</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Change Request</DialogTitle>
                  <DialogDescription>Submit a request for changes that require approval.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="request-type">Request Type</Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="settings">Settings Change</SelectItem>
                        <SelectItem value="task">Task Management</SelectItem>
                        <SelectItem value="member">Member Management</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="request-title">Title</Label>
                    <Input
                      id="request-title"
                      value={requestTitle}
                      onChange={(e) => setRequestTitle(e.target.value)}
                      placeholder="Brief title for your request"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="request-description">Description</Label>
                    <Textarea
                      id="request-description"
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder="Describe what you're requesting and why"
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Pending Requests</h3>
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getStatusIcon(request.status)}</div>
                            <div>
                              <h4 className="font-medium">{request.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>By {request.requestedBy.fullName}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          {currentUserRole === "Leader" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => onApprove(request.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => onReject(request.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {otherRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Previous Requests</h3>
                  <div className="space-y-3">
                    {otherRequests.map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getStatusIcon(request.status)}</div>
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{request.title}</h4>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>By {request.requestedBy.fullName}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {requests.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">No change requests yet</p>
                  {!canEditDirectly && currentUserRole !== "Leader" && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>New Request</Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">No change requests yet</p>
            {!canEditDirectly && currentUserRole !== "Leader" && (
              <Button onClick={() => setIsCreateModalOpen(true)}>New Request</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
