"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import TeamMembersList from "@/components/team-manager/team-members-list"
import InviteMember from "@/components/team-manager/invite-member"
import ActivityLog from "@/components/team-manager/activity-log"
import Announcements from "@/components/team-manager/announcements"
import { Users,UserPlus, Activity, MessageSquare } from "lucide-react"

interface TeamManagementDashboardProps {
  sessionId: string
}

export default function TeamManagementDashboard({ sessionId }: TeamManagementDashboardProps) {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Manage your team members, roles, and activities</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section id="team-members" className="scroll-mt-16">
          <Card className="overflow-hidden  shadow-md">
            <CardHeader >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 " />
                <CardTitle>Team Members</CardTitle>
              </div>
              <CardDescription>Manage and organize your team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TeamMembersList sessionId={sessionId} />
            </CardContent>
          </Card>
        </section>



        <section id="invite-member" className="scroll-mt-16">
          <Card className="overflow-hidden  shadow-md">
            <CardHeader >
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 " />
                <CardTitle>Invite New Team Member</CardTitle>
              </div>
              <CardDescription>Send an invitation to add a new member to your team</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InviteMember sessionId={sessionId} />
            </CardContent>
          </Card>
        </section>

        <section id="activity-log" className="scroll-mt-16">
          <Card className="overflow-hidden  shadow-md">
            <CardHeader >
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 " />
                <CardTitle>Activity Log</CardTitle>
              </div>
              <CardDescription>Track all actions performed by team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityLog sessionId={sessionId} />
            </CardContent>
          </Card>
        </section>

        <section id="announcements" className="scroll-mt-16">
          <Card className="overflow-hidden  shadow-md">
            <CardHeader >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 " />
                <CardTitle>Announcements & Tasks</CardTitle>
              </div>
              <CardDescription>Post announcements and assign tasks to team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Announcements sessionId={sessionId} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
