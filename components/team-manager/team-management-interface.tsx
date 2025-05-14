"use client"

import { useState, useEffect } from "react"
import TeamMembersTable from "@/components/team-manager/team-members-table"
import TaskBlock from "@/components/team-manager/task-block"
import LogBlock from "@/components/team-manager/log-block"
import AddMemberModal from "@/components/team-manager/add-member-modal"
import TaskDialog from "@/components/team-manager/task-dialog"
import ChangesRequestedBlock from "@/components/team-manager/changes-requested-block"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamProvider, useTeam } from "./team-context"

function TeamManagementContent() {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Card className="team-card">
        <CardHeader className="team-card-header flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Team Members</CardTitle>
            <CardDescription>View, add, or remove team members assigned to this session.</CardDescription>
          </div>

        </CardHeader>
        <CardContent className="team-card-content team-members-container">
          <TeamMembersTable onAssignTask={() => setIsTaskDialogOpen(true)} onAddMember={() => setIsAddMemberModalOpen(true)} />
        </CardContent>
      </Card>

      <Card className="team-card">

        <CardContent className="team-card-content">
          <TaskBlock onAddTask={() => setIsTaskDialogOpen(true)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LogBlock />
        <ChangesRequestedBlock />
      </div>

      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)}
      />
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
      />
    </div>
  )
}

// Main component wrapper with provider
export default function TeamManagementInterface() {
  const params = useParams()
  const sessionId = params.id as string
  
  return (
    <TeamProvider sessionId={sessionId}>
      <TeamManagementContent />
    </TeamProvider>
  )
}
