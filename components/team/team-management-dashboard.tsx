"use client"

import { useState, useEffect } from "react"
import TeamTable from "./team-table"
import TaskManagement from "./task-management"
import ActivityLog from "./activity-log"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskModal from "./task-modal"
import AddMemberModal from "../team-manager/add-member-modal"
import { useRouter, useSearchParams } from "next/navigation"
import { teamService } from "@/api/team-service"
import { taskService } from "@/api/task-service"
import { toast } from "sonner"

// Types
export interface TeamMember {
  _id: string
  username: string
  fullName?: string
  email: string
  avatar?: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  color: string
  dueDate: string
  assignedMembers: string[]
  assignedTo?: TeamMember[]
  status: "pending" | "completed"
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: Date
  user: {
    username: string
    fullName: string
  }
}

export default function TeamManagementDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  
  const [teamId, setTeamId] = useState<string>("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamLeader, setIsTeamLeader] = useState(false)

  // Load team data
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!sessionId) {
        toast.error("Session ID is missing")
        return
      }

      try {
        setIsLoading(true)
        
        // First get the team associated with this session
        const teamData = await teamService.getTeamById(sessionId)
        setTeamId(teamData._id)
        
        // Check if current user is team leader
        setIsTeamLeader(teamService.isTeamLeader(teamData))
        
        // Get team members
        const membersData = await teamService.getTeamMembers(teamData._id)
        
        // Format team members to match our interface
        const formattedMembers: TeamMember[] = [
          {
            _id: membersData.leader._id,
            username: membersData.leader.username,
            fullName: membersData.leader.fullName || membersData.leader.username,
            email: membersData.leader.email,
            avatar: "/placeholder.svg?height=40&width=40",
          },
          ...membersData.members.map((member: any) => ({
            _id: member._id,
            username: member.username,
            fullName: member.fullName || member.username,
            email: member.email,
            avatar: "/placeholder.svg?height=40&width=40",
          }))
        ]
        
        setTeamMembers(formattedMembers)
        
        // Get tasks for this session
        const tasksData = await taskService.getSessionTasks(sessionId)
        
        // Format tasks to match our interface
        const formattedTasks = tasksData.map((task: any) => {
          // Find the assigned members for this task
          const assignedTo = formattedMembers.filter(member => 
            task.assignedMembers.includes(member._id)
          )
          
          return {
            _id: task._id,
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            color: task.color,
            dueDate: task.dueDate,
            assignedMembers: task.assignedMembers,
            assignedTo,
            status: task.status
          }
        })
        
        setTasks(formattedTasks)
        
        // For now, we'll keep using the mock activities
        // In a real implementation, you would fetch activities from an API
        
      } catch (error: any) {
        console.error("Failed to load team data:", error)
        toast.error("Failed to load team data", {
          description: error.message
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTeamData()
  }, [sessionId])

  // Initial activities (mock data for now)
  const initialActivities: ActivityItem[] = [
    {
      id: "activity-1",
      type: "task_created",
      description: 'Task "Update user dashboard" was created',
      timestamp: new Date("2025-05-09T08:30:00"),
      user: { username: "admin", fullName: "Admin User" },
    },
    {
      id: "activity-2",
      type: "task_created",
      description: 'Task "Fix login issues" was created',
      timestamp: new Date("2025-05-09T09:15:00"),
      user: { username: "admin", fullName: "Admin User" },
    },
    {
      id: "activity-3",
      type: "task_created",
      description: 'Task "Create documentation" was created',
      timestamp: new Date("2025-05-09T10:00:00"),
      user: { username: "admin", fullName: "Admin User" },
    },
    {
      id: "activity-4",
      type: "member_added",
      description: "New member was added to the team",
      timestamp: new Date("2025-05-08T14:45:00"),
      user: { username: "admin", fullName: "Admin User" },
    },
  ]

  useEffect(() => {
    setActivities(initialActivities)
  }, [])

  const handleAddTask = async (task: Task) => {
    if (!sessionId) {
      toast.error("Session ID is missing")
      return
    }
    
    try {
      // Prepare task data for API
      const taskData = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedMembers: task.assignedTo?.map(member => member._id) || [],
        session: sessionId,
        color: task.color
      }
      
      // Create task via API
      const createdTask = await taskService.createTask(taskData)
      
      // Format the created task to match our interface
      const newTask: Task = {
        _id: createdTask._id,
        title: createdTask.title,
        description: createdTask.description || "",
        priority: createdTask.priority,
        color: createdTask.color,
        dueDate: createdTask.dueDate || new Date().toISOString(), // Ensure dueDate is always a string
        assignedMembers: createdTask.assignedMembers,
        assignedTo: teamMembers.filter(member => 
          createdTask.assignedMembers.includes(member._id)
        ),
        status: createdTask.status
      }
      
      // Update local state
      setTasks([...tasks, newTask])
      
      // Add activity for task creation
      const newActivity: ActivityItem = {
        id: `activity-${Date.now()}`,
        type: "task_created",
        description: `Task "${task.title}" was created and assigned to ${task.assignedTo?.map((member) => member.fullName || member.username).join(", ") || ""}`,
        timestamp: new Date(),
        user: { username: "current_user", fullName: "Current User" },
      }
      
      setActivities([newActivity, ...activities])
      setIsTaskModalOpen(false)
      
      toast.success("Task created successfully")
    } catch (error: any) {
      console.error("Failed to create task:", error)
      toast.error("Failed to create task", {
        description: error.message
      })
    }
  }

  const handleInviteMember = () => {
    if (!sessionId) {
      toast.error("Session ID is missing")
      return
    }
    
    setIsAddMemberModalOpen(true)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading team data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Manage your team members, assign tasks, and track activities</p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-6">
          <TeamTable
            teamMembers={teamMembers}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
            onAssignTask={() => setIsTaskModalOpen(true)}
            onAddMember={handleInviteMember}
            isTeamLeader={isTeamLeader}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <TaskManagement
            tasks={tasks}
            teamMembers={teamMembers}
            onAddTask={() => setIsTaskModalOpen(true)}
            onTaskUpdate={async (updatedTask) => {
              try {
                // Update task via API
                await taskService.updateTask(updatedTask._id, {
                  title: updatedTask.title,
                  description: updatedTask.description,
                  priority: updatedTask.priority,
                  dueDate: updatedTask.dueDate,
                  assignedMembers: updatedTask.assignedMembers,
                  session: sessionId || "",
                  color: updatedTask.color
                })
                
                // Update local state
                setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
                
                // Add activity for task update
                const newActivity: ActivityItem = {
                  id: `activity-${Date.now()}`,
                  type: "task_updated",
                  description: `Task "${updatedTask.title}" was updated`,
                  timestamp: new Date(),
                  user: { username: "current_user", fullName: "Current User" },
                }
                
                setActivities([newActivity, ...activities])
                
                toast.success("Task updated successfully")
              } catch (error: any) {
                console.error("Failed to update task:", error)
                toast.error("Failed to update task", {
                  description: error.message
                })
              }
            }}
            isTeamLeader={isTeamLeader}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityLog activities={activities} />
        </TabsContent>
      </Tabs>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onAddTask={handleAddTask}
          teamMembers={teamMembers}
          preselectedMembers={selectedMembers}
          sessionId={sessionId || ""}
        />
      )}

      {isAddMemberModalOpen && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          sessionId={sessionId || ""}
        />
      )}
    </div>
  )
}
