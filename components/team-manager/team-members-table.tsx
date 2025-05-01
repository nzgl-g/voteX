"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { Button } from "@/components/shadcn-ui/button"
import { Checkbox } from "@/components/shadcn-ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn-ui/dialog"
import { Badge } from "@/components/shadcn-ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar"
import { Input } from "@/components/shadcn-ui/input"
import { Edit, Filter, MoreHorizontal, Search, Trash2, ClipboardCopy, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "@/components/shadcn-ui/use-toast"
// Import the new team service
import { teamService } from "@/api/team-service"
import { sessionService } from "@/api/session-service"

// Use the TeamMember interface from the team service, but extend it for our UI needs
import { TeamMember as BaseTeamMember } from "@/api/team-service"

interface TeamMember extends BaseTeamMember {
  role?: 'Leader' | 'Member'
  uniqueId?: string // Unique identifier for React keys
}

interface TeamMembersTableProps {
  sessionId: string
  selectedMembers: string[]
  setSelectedMembers: (members: string[]) => void
  onAssignTask: () => void
  onAddMember: () => void
}

export default function TeamMembersTable({
  sessionId,
  selectedMembers,
  setSelectedMembers,
  onAssignTask,
  onAddMember,
}: TeamMembersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!sessionId) return
      
      setIsLoading(true)
      try {
        console.log(`Fetching team members for session: ${sessionId}`)
        
        let teamId;
        
        try {
          // First, try to get the team ID associated with the session
          teamId = await sessionService.getSessionTeam(sessionId);
          console.log(`Found team ID: ${teamId} for session: ${sessionId}`);
        } catch (error: any) {
          console.warn(`Could not get team ID from session service: ${error.message}`);
          console.log('Falling back to using sessionId as teamId');
          teamId = sessionId; // Fallback to using sessionId directly
        }
        
        if (!teamId) {
          throw new Error(`No team found for session ${sessionId}`);
        }
        
        // Use the team service to get team members
        const teamMembersData = await teamService.getTeamMembers(teamId);
        console.log('Team members received:', teamMembersData);
        
        // Process the team data to create a unified array with proper roles
        const processedMembers: TeamMember[] = [];
        
        // Add the leader with a Leader role
        if (teamMembersData.leader) {
          processedMembers.push({
            ...teamMembersData.leader,
            role: 'Leader',
            uniqueId: `leader-${teamMembersData.leader._id}`
          });
        }
        
        // Add members with a Member role
        if (teamMembersData.members && Array.isArray(teamMembersData.members)) {
          teamMembersData.members.forEach((member, index) => {
            processedMembers.push({
              ...member,
              role: 'Member',
              uniqueId: `member-${member._id}-${index}`
            });
          });
        }
        
        setTeamMembers(processedMembers);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch team members:", err);
        
        // Enhanced error reporting
        let errorMessage = "Failed to load team members. Please try again.";
        if (err.response) {
          errorMessage += ` (Status: ${err.response.status})`;
          console.error('Response data:', err.response.data);
        }
        
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, [sessionId])

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(filteredMembers.map((member) => member._id))
    }
  }

  const handleCopyUsername = (username: string) => {
    navigator.clipboard.writeText(username)
    toast({
      title: "Username copied",
      description: `Username "${username}" has been copied to clipboard.`,
    })
  }

  const handleDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete || !sessionId) return
    
    try {
      let teamId;
      
      try {
        // First, try to get the team ID associated with the session
        teamId = await sessionService.getSessionTeam(sessionId);
        console.log(`Found team ID: ${teamId} for session: ${sessionId}`);
      } catch (error: any) {
        console.warn(`Could not get team ID from session service: ${error.message}`);
        console.log('Falling back to using sessionId as teamId');
        teamId = sessionId; // Fallback to using sessionId directly
      }
      
      if (!teamId) {
        throw new Error(`No team found for session ${sessionId}`);
      }
      
      console.log(`Attempting to remove member ${memberToDelete} from team ${teamId}`);
      
      try {
        // Use the team service to remove the member
        const response = await teamService.removeTeamMember(teamId, memberToDelete);
        console.log('Remove member response:', response);
        
        // Update the local state to remove the member
        setTeamMembers(teamMembers.filter(member => member._id !== memberToDelete));
        
        toast({
          title: "Member removed",
          description: "The team member has been removed successfully.",
        });
        
        // If the removed member was selected, remove it from selected members
        if (selectedMembers.includes(memberToDelete)) {
          setSelectedMembers(selectedMembers.filter(id => id !== memberToDelete));
        }
      } catch (removeError: any) {
        console.error('Detailed remove error:', removeError);
        console.error('Response data:', removeError.response?.data);
        console.error('Status code:', removeError.response?.status);
        throw removeError;
      }
    } catch (err) {
      console.error("Failed to remove team member:", err);
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <Button variant="default" size="sm" onClick={onAddMember}>
            Add Member
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading team members...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center p-8 text-red-500">
            <p>{error}</p>
            <Button variant="outline" className="ml-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchQuery ? "No members match your search." : "No team members found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  // Ensure we have a truly unique key for each row
                  const rowKey = member.uniqueId || `member-${member._id}-${member.role}-${Math.random().toString(36).substring(2, 9)}`;
                  
                  return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMembers.includes(member._id)}
                        onCheckedChange={() => handleSelectMember(member._id)}
                        aria-label={`Select ${member.username}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center">
                          {member.username}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => handleCopyUsername(member.username)}
                          >
                            <ClipboardCopy className="h-3.5 w-3.5" />
                            <span className="sr-only">Copy username</span>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'Leader' ? "default" : "outline"} className={member.role === 'Leader' ? "bg-blue-500" : ""}>
                        {member.role || 'Member'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Edit member",
                                description: `Editing ${member.username}'s details.`,
                              })
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteMember(member._id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onAssignTask}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Assign Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this team member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMember}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
