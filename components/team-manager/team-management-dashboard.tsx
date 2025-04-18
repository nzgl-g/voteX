"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import TeamMembersList from "@/components/team-manager/team-members-list"
import RolesPermissions from "@/components/team-manager/roles-permissions"
import InviteMember from "@/components/team-manager/invite-member"
import ActivityLog from "@/components/team-manager/activity-log"
import Announcements from "@/components/team-manager/announcements"
import { Users, ShieldCheck, UserPlus, Activity, MessageSquare } from "lucide-react"

export default function TeamManagementDashboard() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Manage your team members, roles, and activities</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section id="team-members" className="scroll-mt-16">
          <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Team Members</CardTitle>
              </div>
              <CardDescription>Manage and organize your team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TeamMembersList />
            </CardContent>
          </Card>
        </section>

        <section id="roles-permissions" className="scroll-mt-16">
          <Card className="overflow-hidden border-t-4 border-t-cyan-500 shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-500" />
                <CardTitle>Roles & Permissions</CardTitle>
              </div>
              <CardDescription>Manage roles and assign permissions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <RolesPermissions />
            </CardContent>
          </Card>
        </section>

        <section id="invite-member" className="scroll-mt-16">
          <Card className="overflow-hidden border-t-4 border-t-violet-500 shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-violet-500" />
                <CardTitle>Invite New Team Member</CardTitle>
              </div>
              <CardDescription>Send an invitation to add a new member to your team</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InviteMember />
            </CardContent>
          </Card>
        </section>

        <section id="activity-log" className="scroll-mt-16">
          <Card className="overflow-hidden border-t-4 border-t-amber-500 shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                <CardTitle>Activity Log</CardTitle>
              </div>
              <CardDescription>Track all actions performed by team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityLog />
            </CardContent>
          </Card>
        </section>

        <section id="announcements" className="scroll-mt-16">
          <Card className="overflow-hidden border-t-4 border-t-emerald-500 shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                <CardTitle>Announcements & Tasks</CardTitle>
              </div>
              <CardDescription>Post announcements and assign tasks to team members</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Announcements />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
