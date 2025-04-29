"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { TeamMembersTable } from "@/components/team-manager/team-members-table"
import { AddMemberModal } from "@/components/team-manager/add-member-modal"
import { TaskBlock } from "@/components/team-manager/task-block"
import { LogBlock } from "@/components/team-manager/log-block"
import { AssignTaskModal } from "@/components/team-manager/assign-task-modal"
import { TeamSettingsModal } from "@/components/team-manager/team-settings-modal"
import { ChangeRequestsBlock } from "@/components/team-manager/change-requests-block"
import { Edit, Settings } from "lucide-react"

interface TeamManagementProps {
  teamName: string
  allowMembersToChangeSettings: boolean
  onUpdateTeam: (name: string, allowChanges: boolean) => void
  onAddMember?: (email: string, isInvite: boolean) => Promise<boolean | undefined> | void
  onRemoveMember?: (memberId: string) => Promise<boolean | undefined> | void
}

export function TeamManagement({ 
  teamName, 
  allowMembersToChangeSettings, 
  onUpdateTeam,
  onAddMember,
  onRemoveMember
}: TeamManagementProps) {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [changeRequests, setChangeRequests] = useState<any[]>([
    {
      id: "req-1",
      type: "settings",
      title: "Enable member editing",
      description: "Allow all members to edit team settings",
      requestedBy: { id: "2", fullName: "Jane Doe" },
      status: "pending",
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: "req-2",
      type: "task",
      title: "Add new task category",
      description: "Create a 'Research' category for tasks",
      requestedBy: { id: "3", fullName: "Bob Smith" },
      status: "pending",
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
    },
  ])

  // Mock data for team members
  const [teamMembers, setTeamMembers] = useState([
    { id: "1", username: "johndoe", fullName: "John Doe", email: "john@example.com", role: "Leader", status: "online" },
    {
      id: "2",
      username: "janedoe",
      fullName: "Jane Doe",
      email: "jane@example.com",
      role: "Member",
      status: "offline",
    },
    {
      id: "3",
      username: "bobsmith",
      fullName: "Bob Smith",
      email: "bob@example.com",
      role: "Member",
      status: "online",
    },
  ])

  const handleAddMember = async (email: string, isInvite: boolean) => {
    // If external handler is provided, use it
    if (onAddMember) {
      const success = await onAddMember(email, isInvite);
      if (success !== false) {
        setIsAddMemberModalOpen(false);
      }
      return;
    }
    
    // Fallback to mock implementation
    // In a real app, this would send an API request
    if (isInvite) {
      console.log(`Invitation sent to ${email}`)
    } else {
      const newId = (teamMembers.length + 1).toString()
      setTeamMembers([
        ...teamMembers,
        {
          id: newId,
          username: email.split("@")[0],
          fullName: email.split("@")[0],
          email,
          role: "Member",
          status: "offline",
        },
      ])
    }
    setIsAddMemberModalOpen(false)
  }

  const handleRemoveMember = async (id: string) => {
    // If external handler is provided, use it
    if (onRemoveMember) {
      const success = await onRemoveMember(id);
      if (success !== false) {
        setSelectedMembers(selectedMembers.filter((memberId) => memberId !== id));
      }
      return;
    }
    
    // Fallback to mock implementation
    setTeamMembers(teamMembers.filter((member) => member.id !== id))
    setSelectedMembers(selectedMembers.filter((memberId) => memberId !== id))
  }

  const handleAssignTask = (taskData: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      createdAt: new Date(),
    }
    setTasks([...tasks, newTask])
    setIsAssignTaskModalOpen(false)
    // In a real app, this would send an API request
  }

  const handleUpdateTeamSettings = (name: string, allowChanges: boolean) => {
    onUpdateTeam(name, allowChanges)
    setIsSettingsModalOpen(false)
  }

  const handleChangeRequestAction = (requestId: string, action: "approve" | "reject") => {
    setChangeRequests(
      changeRequests.map((request) =>
        request.id === requestId ? { ...request, status: action === "approve" ? "approved" : "rejected" } : request,
      ),
    )

    // If approving a settings change request, update the team settings
    const request = changeRequests.find((req) => req.id === requestId)
    if (action === "approve" && request?.type === "settings") {
      // This is a simplified example - in a real app, you'd handle different types of settings changes
      onUpdateTeam(teamName, true)
    }
  }

  const handleCreateChangeRequest = (type: string, title: string, description: string) => {
    const newRequest = {
      id: `req-${Date.now()}`,
      type,
      title,
      description,
      requestedBy: teamMembers.find((member) => member.id === "2"), // Hardcoded for demo
      status: "pending",
      createdAt: new Date(),
    }
    setChangeRequests([...changeRequests, newRequest])
  }

  // Current user role - in a real app, this would come from authentication
  const currentUserRole = "Leader"
  const canEditDirectly = currentUserRole === "Leader" || allowMembersToChangeSettings

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{teamName}</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsModalOpen(true)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit team</span>
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsAddMemberModalOpen(true)}>
            Add Member
          </Button>
          <Button onClick={() => setIsAssignTaskModalOpen(true)}>Add Task</Button>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">Team settings</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamMembersTable
                members={teamMembers}
                selectedMembers={selectedMembers}
                onSelectMembers={setSelectedMembers}
                onRemoveMember={handleRemoveMember}
                onAssignTask={(id) => {
                  setSelectedMembers([id])
                  setIsAssignTaskModalOpen(true)
                }}
              />
            </CardContent>
          </Card>

          <TaskBlock tasks={tasks} onAddTask={() => setIsAssignTaskModalOpen(true)} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <LogBlock />

          <ChangeRequestsBlock
            requests={changeRequests}
            onApprove={(id) => handleChangeRequestAction(id, "approve")}
            onReject={(id) => handleChangeRequestAction(id, "reject")}
            onCreateRequest={handleCreateChangeRequest}
            canEditDirectly={canEditDirectly}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
      />

      <AssignTaskModal
        isOpen={isAssignTaskModalOpen}
        onClose={() => setIsAssignTaskModalOpen(false)}
        onAssignTask={handleAssignTask}
        teamMembers={teamMembers}
        initialSelectedMembers={selectedMembers}
      />

      <TeamSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={handleUpdateTeamSettings}
        teamName={teamName}
        allowMembersToChangeSettings={allowMembersToChangeSettings}
      />
    </div>
  )
}
