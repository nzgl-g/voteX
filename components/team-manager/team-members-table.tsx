"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Edit, 
  Filter, 
  MoreHorizontal, 
  Search, 
  Trash2, 
  ClipboardCopy, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  AlertCircle,
  UserPlus,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { teamService, TeamMember as BaseTeamMember } from "@/api/team-service"
import { sessionService } from "@/api/session-service"
import { Card, CardContent } from "@/components/ui/card"

// Extend the TeamMember interface for UI needs
interface TeamMember extends BaseTeamMember {
  role?: 'Leader' | 'Member'
  uniqueId?: string
  avatar?: string
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
  const [teamId, setTeamId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTeamMembers = async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      // First, get the team ID associated with the session
      const fetchedTeamId = await sessionService.getSessionTeam(sessionId);
      
      if (!fetchedTeamId || typeof fetchedTeamId !== 'string') {
        throw new Error(`Invalid team ID received: ${fetchedTeamId}`);
      }
      
      setTeamId(fetchedTeamId);
      
      // Use the team service to get team members
      const teamData = await teamService.getTeamMembers(fetchedTeamId);
      
      // Process the team data according to the server model structure
      const processedMembers: TeamMember[] = [];
      
      // Add the leader with a Leader role
      if (teamData.leader) {
        processedMembers.push({
          ...teamData.leader,
          role: 'Leader',
          uniqueId: `leader-${teamData.leader._id}`,
          avatar: `/api/avatar?name=${teamData.leader.username || 'L'}`
        });
      }
      
      // Add members with a Member role
      if (teamData.members && Array.isArray(teamData.members)) {
        teamData.members.forEach((member, index) => {
          // Skip if this member is the same as the leader (prevent duplication)
          if (teamData.leader && member._id === teamData.leader._id) {
            return;
          }
          
          processedMembers.push({
            ...member,
            role: 'Member',
            uniqueId: `member-${member._id}-${index}`,
            avatar: `/api/avatar?name=${member.username || 'M'}`
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
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error("Error loading team members", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [sessionId])

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeamMembers();
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()),
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
    toast.success("Username copied", {
      description: `Username "${username}" has been copied to clipboard.`,
    })
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    toast.success("Email copied", {
      description: `Email "${email}" has been copied to clipboard.`,
    })
  }

  const handleDeleteMember = (memberId: string) => {
    // Check if this member is the team leader
    const memberToRemove = teamMembers.find(member => member._id === memberId);
    
    if (memberToRemove?.role === 'Leader') {
      toast.error("Cannot Remove Leader", {
        description: "The team leader cannot be removed. Transfer leadership to another member first.",
      });
      return;
    }
    
    setMemberToDelete(memberId);
    setIsDeleteDialogOpen(true);
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete || !teamId) return
    
    try {
      // Use the team service to remove the member
      await teamService.removeTeamMember(teamId, memberToDelete);
      
      // Update the local state to remove the member
      setTeamMembers(teamMembers.filter(member => member._id !== memberToDelete));
      
      toast.success("Member removed", {
        description: "The team member has been removed successfully.",
      });
      
      // If the removed member was selected, remove it from selected members
      if (selectedMembers.includes(memberToDelete)) {
        setSelectedMembers(selectedMembers.filter(id => id !== memberToDelete));
      }
    } catch (err: any) {
      // Handle specific error messages
      let errorMessage = "Failed to remove team member. Please try again.";
      
      // Extract error message from the error object
      if (typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      // Display the error toast
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  }

  const getMemberToDeleteDetails = () => {
    if (!memberToDelete) return null;
    return teamMembers.find(member => member._id === memberToDelete);
  };

  const memberToRemove = getMemberToDeleteDetails();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-1"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={onAddMember}
            className="h-9 gap-1"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading team members...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Failed to load team members</h3>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </CardContent>
          </Card>
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
                <TableHead>Member</TableHead>
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
                  <TableRow key={rowKey} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedMembers.includes(member._id)}
                        onCheckedChange={() => handleSelectMember(member._id)}
                        aria-label={`Select ${member.username}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={member.avatar} alt={member.username} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {member.fullName 
                              ? member.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                              : member.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium">{member.username}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-1 opacity-50 hover:opacity-100"
                              onClick={() => handleCopyUsername(member.username)}
                            >
                              <ClipboardCopy className="h-3 w-3" />
                              <span className="sr-only">Copy username</span>
                            </Button>
                          </div>
                          {member.fullName && (
                            <span className="text-xs text-muted-foreground">{member.fullName}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm truncate max-w-[180px]">{member.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => handleCopyEmail(member.email)}
                        >
                          <ClipboardCopy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={member.role === 'Leader' ? "default" : "outline"} 
                        className={member.role === 'Leader' 
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : "hover:bg-muted"}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              toast.success("Edit member", {
                                description: `Editing ${member.username}'s details.`,
                              })
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCopyEmail(member.email)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAssignTask()}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Assign Task
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {member.role !== 'Leader' ? (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMember(member._id)} 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="text-muted-foreground cursor-not-allowed">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cannot Remove Leader
                            </DropdownMenuItem>
                          )}
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
              Are you sure you want to remove {memberToRemove?.username || "this team member"}?
              {memberToRemove?.fullName && ` (${memberToRemove.fullName})`} This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            {memberToRemove && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={memberToRemove.avatar} alt={memberToRemove.username} />
                  <AvatarFallback>
                    {memberToRemove.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{memberToRemove.username}</p>
                  <p className="text-sm text-muted-foreground">{memberToRemove.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
