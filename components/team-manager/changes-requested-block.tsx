"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

// Mock data for change requests
const changeRequests = [
  {
    id: "1",
    user: {
      name: "Jane Doe",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    request: "Request to change team name to 'Innovation Squad'",
    timestamp: "2023-06-04T15:45:00",
    status: "pending",
  },
  {
    id: "2",
    user: {
      name: "Bob Smith",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    request: "Request to add a new role: 'Designer'",
    timestamp: "2023-06-03T09:15:00",
    status: "pending",
  },
  {
    id: "3",
    user: {
      name: "Alice Jones",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    request: "Request to change project deadline to June 30th",
    timestamp: "2023-06-01T11:10:00",
    status: "approved",
  },
]

export default function ChangesRequestedBlock() {
  const handleApprove = (id: string) => {
    toast.success("Change request approved", {
      description: "The change request has been approved.",
    })
  }

  const handleReject = (id: string) => {
    toast.error("Change request rejected", {
      description: "The change request has been rejected.",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {changeRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No change requests at the moment.</p>
        ) : (
          changeRequests.map((request) => (
            <div key={request.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.user.avatar || "/placeholder.svg"} alt={request.user.name} />
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
                  <Badge variant={request.status === "approved" ? "default" : "outline"}>{request.status}</Badge>
                </div>
                <p className="text-sm">{request.request}</p>
                <p className="text-xs text-muted-foreground">{formatDate(request.timestamp)}</p>
                {request.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reject
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
