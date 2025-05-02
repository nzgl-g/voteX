"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { CheckCircle, XCircle, Building, Users, CalendarClock } from "lucide-react"
import { toast } from "@/components/shadcn-ui/use-toast"
import { invitationService, InvitationWithTeam } from "@/api/invitation-service"
import { Skeleton } from "@/components/shadcn-ui/skeleton"
import { useRouter } from "next/navigation"

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<InvitationWithTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  // Fetch pending invitations on component mount
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true)
        const data = await invitationService.getUserInvitations()
        setInvitations(data)
      } catch (error) {
        console.error("Failed to fetch invitations:", error)
        toast({
          title: "Error",
          description: "Could not load your pending invitations. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  // Handle accepting an invitation
  const handleAccept = async (invitationId: string) => {
    setActionLoading({ ...actionLoading, [invitationId]: true })
    try {
      const response = await invitationService.acceptInvitation(invitationId)
      
      // Remove the invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId))
      
      toast({
        title: "Invitation Accepted",
        description: "You have successfully joined the team.",
        variant: "default",
      })
      
      // Redirect to team dashboard after a brief delay
      setTimeout(() => {
        router.push(`/team-member/monitoring/default`)
      }, 1500)
    } catch (error: any) {
      console.error("Failed to accept invitation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      const newActionLoading = { ...actionLoading }
      delete newActionLoading[invitationId]
      setActionLoading(newActionLoading)
    }
  }

  // Handle declining an invitation
  const handleDecline = async (invitationId: string) => {
    setActionLoading({ ...actionLoading, [invitationId]: true })
    try {
      await invitationService.declineInvitation(invitationId)
      
      // Remove the invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId))
      
      toast({
        title: "Invitation Declined",
        description: "You have declined the team invitation.",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Failed to decline invitation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      const newActionLoading = { ...actionLoading }
      delete newActionLoading[invitationId]
      setActionLoading(newActionLoading)
    }
  }

  // If still loading, show skeletons
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
        {[1, 2].map(i => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/3 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <div className="flex justify-end w-full space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // If no invitations, show empty state
  if (invitations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
        <Card className="shadow-sm bg-muted/30">
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">You don't have any pending team invitations</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render invitations
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
      {invitations.map(invitation => (
        <Card key={invitation._id} className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary" />
              <div>
                <CardTitle className="text-base">{invitation.team?.sessionName || "Team Invitation"}</CardTitle>
                <CardDescription>
                  From: {invitation.team?.leader?.username || "Team Leader"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              You've been invited to join this team as a member. Accept to participate in this session.
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              <span>Invitation sent on {new Date(invitation._id.toString().substring(0, 8)).toLocaleDateString()}</span>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end w-full space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleDecline(invitation._id)}
                disabled={!!actionLoading[invitation._id]}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button 
                onClick={() => handleAccept(invitation._id)}
                disabled={!!actionLoading[invitation._id]}
              >
                {actionLoading[invitation._id] ? (
                  <span className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Accept
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
} 