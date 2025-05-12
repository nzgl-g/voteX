"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import TeamMembersTable from "@/components/team-manager/team-members-table"
import TaskBlock from "@/components/team-manager/task-block"
import LogBlock from "@/components/team-manager/log-block"
import AddMemberModal from "@/components/team-manager/add-member-modal"
import TaskDialog from "@/components/team-manager/task-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Updated CSS selectors to better target duplicated buttons
const injectStyle = () => {
  if (typeof window === 'undefined') return;
  
  // Check if the style already exists
  const id = 'team-management-style';
  if (document.getElementById(id)) return;
  
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = `
    /* Hide specific duplicated buttons in child components */
    /* Target refresh button in TeamMembersTable */
    .team-members-container [data-slot="button"]:has(svg[data-lucide="refresh-cw"]),
    /* Target add member button in TeamMembersTable */
    .team-members-container [data-slot="button"]:has(svg[data-lucide="plus-circle"]),
    /* Target assign task button in TaskBlock */
    .team-card:has([data-slot="card-title"]:contains("Tasks")) + * button:has(svg[data-lucide="plus-circle"]) {
      display: none !important;
    }
    
    /* Hide any button containers/toolbars that might become empty */
    .team-members-container div:has(> button:only-child[style*="display: none"]),
    .team-members-container div:empty {
      display: none !important;
    }
    
    /* Enhanced card styling */
    .team-card {
      transition: all 0.2s ease;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .team-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    
    /* Card header styling */
    .team-card-header {
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding-bottom: 0.75rem;
    }
    
    /* Card content padding */
    .team-card-content {
      padding-top: 1rem;
    }
  `;
  
  document.head.appendChild(style);
};

export default function TeamManagementInterface() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const params = useParams()
  const sessionId = params.id as string
  
  // Create a ref to track auto-refresh interval
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshCounter(prev => prev + 1);
    
    // Auto-reset refreshing state after 1 second
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Set up auto-refresh interval (every 15 seconds, but invisible to user)
  useEffect(() => {
    autoRefreshIntervalRef.current = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 15000);
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // Inject our custom styles when component mounts (client-side only)
  if (typeof window !== 'undefined') {
    injectStyle();
  }

  return (
    <div className="space-y-6">
      <Card className="team-card">
        <CardHeader className="team-card-header flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-medium mb-1">Team Members</CardTitle>
            <CardDescription>View, add, or remove team members assigned to this session.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="w-9 h-9 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsAddMemberModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="team-card-content team-members-container">
          <TeamMembersTable
            sessionId={sessionId}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
            onAssignTask={() => setIsTaskDialogOpen(true)}
            onAddMember={() => setIsAddMemberModalOpen(true)}
          />
        </CardContent>
      </Card>

      <Card className="team-card">
        <CardHeader className="team-card-header flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-medium mb-1">Tasks</CardTitle>
            <CardDescription>Manage and assign tasks related to this session.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsTaskDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign Task
          </Button>
        </CardHeader>
        <CardContent className="team-card-content">
          <TaskBlock onAddTask={() => setIsTaskDialogOpen(true)} />
        </CardContent>
      </Card>

      <Card className="team-card">
        <CardHeader className="team-card-header">
          <CardTitle className="text-lg font-medium mb-1">Activity Logs</CardTitle>
          <CardDescription>Recent activities performed by the team within this session.</CardDescription>
        </CardHeader>
        <CardContent className="team-card-content">
          <LogBlock />
        </CardContent>
      </Card>

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
