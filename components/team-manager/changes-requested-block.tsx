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
import { sessionService, EditRequest } from "@/services/session-service"

export default function ChangesRequestedBlock() {
  const { sessionId, refreshCounter } = useTeam()
  const [changeRequests, setChangeRequests] = useState<EditRequest[]>([])
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
      const data = await sessionService.getSessionEditRequests(sessionId)
      console.log("Received edit requests:", data)
      setChangeRequests(data || [])
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
      await sessionService.approveEditRequest(id)
      
      // Optimistically update UI
      setChangeRequests(prev => 
        prev.map(item => 
          item._id === id ? { ...item, status: 'approved' } : item
        )
      )
      
      toast.success("Request approved", {
        description: "The change request has been approved and will be applied.",
      })
      
      // Refresh data after a short delay
      setTimeout(() => {
        loadChangeRequests(false)
      }, 1000)
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
      await sessionService.rejectEditRequest(id)
      
      // Optimistically update UI
      setChangeRequests(prev => 
        prev.map(item => 
          item._id === id ? { ...item, status: 'rejected' } : item
        )
      )
      
      toast.success("Request rejected", {
        description: "The change request has been rejected.",
      })
      
      // Refresh data after a short delay
      setTimeout(() => {
        loadChangeRequests(false)
      }, 1000)
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

  // Format request updates to display in UI
  const formatRequestMessage = (updates: any): string => {
    if (!updates) return "Unknown request";
    
    const keys = Object.keys(updates);
    
    if (keys.length === 0) return "No changes requested";
    
    if (keys.includes('name')) {
      return `Request to change session name to '${updates.name}'`;
    }
    
    if (keys.includes('description')) {
      return `Request to update session description`;
    }
    
    if (keys.includes('sessionLifecycle')) {
      return `Request to update session schedule`;
    }
    
    if (keys.includes('securityMethod')) {
      return `Request to change security method to ${updates.securityMethod}`;
    }
    
    if (keys.includes('secretPhrase')) {
      return `Request to update secret phrase`;
    }
    
    return `Request to update ${keys.join(', ')}`;
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
            <div key={request._id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={`/api/avatar?name=${encodeURIComponent(request.proposedBy?.username || 'U')}`} 
                  alt={request.proposedBy?.username || "User"} 
                />
                <AvatarFallback>
                  {request.proposedBy?.username
                    ? request.proposedBy.username.substring(0, 2).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {request.proposedBy?.username || "User"}
                  </p>
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <p className="text-sm">{formatRequestMessage(request.updates)}</p>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(request.createdAt)}</p>
                {request.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleApprove(request._id)}
                      disabled={!!processing}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {processing === request._id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleReject(request._id)}
                      disabled={!!processing}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                      {processing === request._id ? "Processing..." : "Reject"}
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
