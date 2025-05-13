"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { teamService, TeamMember } from "@/services/team-service"
import { sessionService } from "@/services/session-service"
import { Task, taskService } from "@/services/task-service"
import { toast } from "sonner"

// Define extended TeamMember for UI needs
export interface ExtendedTeamMember extends TeamMember {
  role?: 'Leader' | 'Member'
  uniqueId?: string
  avatar?: string
}

// Define context value type
interface TeamContextValue {
  sessionId: string | null
  teamId: string | null
  teamMembers: ExtendedTeamMember[]
  tasks: Task[]
  selectedMembers: string[]
  isLoading: boolean
  refreshCounter: number
  fetchTeamMembers: () => Promise<void>
  fetchTasks: () => Promise<void>
  setSelectedMembers: (members: string[]) => void
  handleRefresh: () => void
}

// Create context with default values
const TeamContext = createContext<TeamContextValue>({
  sessionId: null,
  teamId: null,
  teamMembers: [],
  tasks: [],
  selectedMembers: [],
  isLoading: true,
  refreshCounter: 0,
  fetchTeamMembers: async () => {},
  fetchTasks: async () => {},
  setSelectedMembers: () => {},
  handleRefresh: () => {},
})

// Custom hook to use team context
export const useTeam = () => useContext(TeamContext)

interface TeamProviderProps {
  children: ReactNode
  sessionId: string
}

export function TeamProvider({ children, sessionId }: TeamProviderProps) {
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<ExtendedTeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1)
  }, [])

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      // First, get the team ID associated with the session
      const fetchedTeamId = await sessionService.getSessionTeam(sessionId)
      
      if (!fetchedTeamId || typeof fetchedTeamId !== 'string') {
        throw new Error(`Invalid team ID received: ${fetchedTeamId}`)
      }
      
      setTeamId(fetchedTeamId)
      
      // Use the team service to get team members
      const teamData = await teamService.getTeamMembers(fetchedTeamId)
      
      // Process the team data
      const processedMembers: ExtendedTeamMember[] = []
      
      // Add the leader with a Leader role
      if (teamData.leader && typeof teamData.leader !== 'string') {
        const leader = teamData.leader as TeamMember;
        processedMembers.push({
          ...leader,
          role: 'Leader',
          uniqueId: `leader-${leader._id}`,
          avatar: `/api/avatar?name=${leader.username || 'L'}`
        })
      }
      
      // Add members with a Member role
      if (teamData.members && Array.isArray(teamData.members)) {
        teamData.members.forEach((member, index) => {
          if (typeof member !== 'string') {
            // Skip if this member is the same as the leader (prevent duplication)
            if (teamData.leader && typeof teamData.leader !== 'string' && 
                member._id === (teamData.leader as TeamMember)._id) {
              return
            }
            
            processedMembers.push({
              ...member,
              role: 'Member',
              uniqueId: `member-${member._id}-${index}`,
              avatar: `/api/avatar?name=${member.username || 'M'}`
            })
          }
        })
      }
      
      setTeamMembers(processedMembers)
    } catch (err: any) {
      console.error("Failed to fetch team members:", err)
      toast.error("Error loading team members", {
        description: err.message || "Failed to load team members",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      const tasksData = await taskService.getSessionTasks(sessionId)
      setTasks(tasksData)
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err)
      toast.error("Error loading tasks", {
        description: err.message || "Failed to load tasks",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Initial data fetch and refresh setup
  useEffect(() => {
    if (sessionId) {
      Promise.all([
        fetchTeamMembers(),
        fetchTasks()
      ]).catch(console.error)
    }
  }, [sessionId, refreshCounter, fetchTeamMembers, fetchTasks])

  // Context value
  const value: TeamContextValue = {
    sessionId,
    teamId,
    teamMembers,
    tasks,
    selectedMembers,
    isLoading,
    refreshCounter,
    fetchTeamMembers,
    fetchTasks,
    setSelectedMembers,
    handleRefresh
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
} 