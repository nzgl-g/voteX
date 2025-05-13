"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { teamService } from "@/services/team-service"
import { Card, CardContent } from "@/components/ui/card"
import { useTeam, ExtendedTeamMember } from "./team-context"

interface TeamMembersTableProps {
  onAssignTask: () => void
  onAddMember: () => void
}

export default function TeamMembersTable({
  onAssignTask,
  onAddMember,
}: TeamMembersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Get data from context
  const { 
    teamId, 
    teamMembers, 
    isLoading, 
    selectedMembers, 
    setSelectedMembers, 
    fetchTeamMembers,
    handleRefresh: contextRefresh
  } = useTeam()

  // Handle local refresh with animation
  const handleRefresh = () => {
    setRefreshing(true)
    contextRefresh()
    
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(
      selectedMembers.includes(memberId)
        ? selectedMembers.filter((id) => id !== memberId)
        : [...selectedMembers, memberId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(teamMembers.map((member) => member._id))
    }
  }

  const handleCopyUsername = (username: string) => {
    navigator.clipboard.writeText(username)
    toast.success("Username copied to clipboard")
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    toast.success("Email copied to clipboard")
  }

  const handleDeleteMember = (memberId: string) => {
    // Find the member to show their details in confirmation dialog
    const member = teamMembers.find(m => m._id === memberId)
    
    if (!member) {
      toast.error("Error", {
        description: "Member not found",
      })
      return
    }
    
    // Don't allow deleting the team leader
    if (member.role === 'Leader') {
      toast.error("Cannot Delete Leader", {
        description: "The team leader cannot be removed from the team.",
      })
      return
    }
    
    setMemberToDelete(memberId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete || !teamId) return
    
    try {
      await teamService.removeTeamMember(teamId, memberToDelete)
      
      // Remove from selected members if selected
      if (selectedMembers.includes(memberToDelete)) {
        setSelectedMembers(selectedMembers.filter(id => id !== memberToDelete))
      }
      
      toast.success("Member Removed", {
        description: "Team member has been removed successfully.",
      })
      
      // Refresh team members
      fetchTeamMembers()
    } catch (error: any) {
      console.error("Failed to remove team member:", error)
      toast.error("Error", {
        description: error.message || "Failed to remove team member. Please try again.",
      })
    } finally {
      setMemberToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const getMemberToDeleteDetails = () => {
    if (!memberToDelete) return { name: '', email: '' }
    
    const member = teamMembers.find(m => m._id === memberToDelete)
    if (!member) return { name: '', email: '' }
    
    return {
      name: member.fullName || member.username,
      email: member.email
    }
  }

  // Filter members based on search query
  const filteredMembers = teamMembers.filter(member => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      member.username.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      (member.fullName && member.fullName.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAddMember}
          className="shrink-0"
          disabled={isLoading}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-center flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="font-medium">Error loading team members</p>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">No members match your search</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">No team members found</p>
              <Button variant="default" size="sm" onClick={onAddMember}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedMembers.length > 0 && selectedMembers.length === teamMembers.length}
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
                {filteredMembers.map((member) => (
                  <TableRow key={member.uniqueId || member._id}>
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
                          <AvatarImage src={member.avatar} alt={member.username} />
                          <AvatarFallback>
                            {member.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.fullName || member.username}</div>
                          <div className="text-sm text-muted-foreground">@{member.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'Leader' ? "default" : "outline"}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => handleCopyUsername(member.username)}>
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy username
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyEmail(member.email)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Copy email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {member.role !== 'Leader' && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteMember(member._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedMembers.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
              <div className="text-sm">
                <span className="font-medium">{selectedMembers.length}</span> member(s) selected
              </div>
              <Button size="sm" onClick={onAssignTask}>
                Assign Task
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog for Member Removal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Member Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{getMemberToDeleteDetails().name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{getMemberToDeleteDetails().email}</span>
              </div>
            </div>
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
