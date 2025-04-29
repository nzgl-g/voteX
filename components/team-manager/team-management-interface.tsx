"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import TeamMembersTable from "@/components/team-manager/team-members-table"
import TaskBlock from "@/components/team-manager/task-block"
import LogBlock from "@/components/team-manager/log-block"
import AddMemberModal from "@/components/team-manager/add-member-modal"
import TaskDialog from "@/components/team-manager/task-dialog"
import { Button } from "@/components/shadcn-ui/button"
import { PlusCircle } from "lucide-react"
import { useParams } from "next/navigation"

export default function TeamManagementInterface() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const params = useParams()
  const sessionId = params.id as string

  const handleAssignTask = () => {
    setIsTaskDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddMemberModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Member
          </Button>
          <Button variant="default" onClick={handleAssignTask} disabled={selectedMembers.length === 0}>
            Assign Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <TeamMembersTable
            sessionId={sessionId}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
            onAssignTask={handleAssignTask}
            onAddMember={() => setIsAddMemberModalOpen(true)}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskBlock onAddTask={() => setIsTaskDialogOpen(true)} />
        </TabsContent>
        <TabsContent value="logs">
          <LogBlock />
        </TabsContent>
      </Tabs>

      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)}
        sessionId={sessionId}
      />

      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        selectedMembers={selectedMembers}
        sessionId={sessionId}
      />
    </div>
  )
}
