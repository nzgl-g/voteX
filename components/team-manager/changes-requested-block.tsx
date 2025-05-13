"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { useTeam } from "./team-context"

// Types for change requests
interface ChangeRequest {
  id: string
  user: {
    name: string
    avatar?: string
  }
  request: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

// Mock data fetch function (replace with real API call)
const fetchChangeRequests = async (sessionId: string): Promise<ChangeRequest[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // In a real app, you would call your API:
  // return await fetch(`/api/sessions/${sessionId}/change-requests`).then(res => res.json())
  
  return [
    {
      id: "1",
      user: {
        name: "Jane Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      request: "Request to change team name to 'Innovation Squad'",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
      status: "pending",
    },
    {
      id: "2",
      user: {
        name: "Bob Smith",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      request: "Request to add a new role: 'Designer'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      status: "pending",
    },
    {
      id: "3",
      user: {
        name: "Alice Jones",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      request: "Request to change project deadline to next month",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
      status: "approved",
    },
    {
      id: "4",
      user: {
        name: "Tom Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      request: "Request to modify the voting mechanism",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(), // 2.3 days ago
      status: "rejected",
    },
  ]
}

// Mock API functions for handling approvals and rejections
const approveChangeRequest = async (id: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  // In a real app: return fetch(`/api/change-requests/${id}/approve`, { method: 'POST' })
}

const rejectChangeRequest = async (id: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  // In a real app: return fetch(`/api/change-requests/${id}/reject`, { method: 'POST' })
}

export default function ChangesRequestedBlock() {
  const { sessionId, refreshCounter } = useTeam()
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  // Load change requests data
  const loadChangeRequests = useCallback(async (showLoadingState = true) => {
    if (!sessionId) return
    
    if (showLoadingState) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    
    try {
      const data = await fetchChangeRequests(sessionId)
      setChangeRequests(data)
    } catch (error) {
      console.error("Failed to fetch change requests:", error)
      if (showLoadingState) {
        toast.error("Error loading changes", {
          description: "Failed to load change requests. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [sessionId])

  // Initial load and refresh when counter changes
  useEffect(() => {
    loadChangeRequests()
  }, [loadChangeRequests, refreshCounter])

  // Manual refresh
  const handleRefresh = () => {
    loadChangeRequests(false)
  }

  // Handle approve request
  const handleApprove = async (id: string) => {
    try {
      setProcessing(id)
      await approveChangeRequest(id)
      
      // Optimistically update UI
      setChangeRequests(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status: 'approved' } : item
        )
      )
      
      toast.success("Request approved", {
        description: "The change request has been approved and will be applied.",
      })
    } catch (error) {
      console.error("Failed to approve request:", error)
      toast.error("Action failed", {
        description: "Failed to approve the request. Please try again.",
      })
    } finally {
      setProcessing(null)
    }
  }

  // Handle reject request
  const handleReject = async (id: string) => {
    try {
      setProcessing(id)
      await rejectChangeRequest(id)
      
      // Optimistically update UI
      setChangeRequests(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status: 'rejected' } : item
        )
      )
      
      toast.success("Request rejected", {
        description: "The change request has been rejected.",
      })
    } catch (error) {
      console.error("Failed to reject request:", error)
      toast.error("Action failed", {
        description: "Failed to reject the request. Please try again.",
      })
    } finally {
      setProcessing(null)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "some time ago"
    }
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'approved': return "default"
      case 'rejected': return "destructive"
      default: return "outline"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium">Change Requests</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted"></div>
                  <div className="h-3 w-1/3 rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        ) : changeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-muted-foreground">No change requests at this time</p>
          </div>
        ) : (
          changeRequests.map((request) => (
            <div key={request.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.user.avatar} alt={request.user.name} />
                <AvatarFallback>
                  {request.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{request.user.name}</p>
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <p className="text-sm">{request.request}</p>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(request.timestamp)}</p>
                {request.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleApprove(request.id)}
                      disabled={!!processing}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {processing === request.id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleReject(request.id)}
                      disabled={!!processing}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                      {processing === request.id ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
