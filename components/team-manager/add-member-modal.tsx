"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Search, Mail, User, Check } from "lucide-react"
import { teamService } from "@/services/team-service"
import { sessionService } from "@/services/session-service"
import { userService, User as UserType } from "@/services/user-service"
import { invitationService } from "@/services/invitation-service"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
}

export default function AddMemberModal({ isOpen, onClose, sessionId }: AddMemberModalProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [message, setMessage] = useState(
    "Hi there! I'd like to invite you to join our team on our project management platform.",
  )
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<UserType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !sessionId) return
    
    // Check if the user is trying to invite themselves
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      if (currentUser.email === inviteEmail) {
        toast.error("Invalid Email", {
          description: "You cannot invite yourself to the team.",
        });
        return;
      }
    }
    
    setIsLoading(true)
    try {
      let teamId;
      
      try {
        // First, try to get the team ID associated with the session
        teamId = await sessionService.getSessionTeam(sessionId)
        console.log(`Found team ID: ${teamId} for session: ${sessionId}`)
      } catch (error: any) {
        console.warn(`Could not get team ID from session service: ${error.message}`)
        console.log('Falling back to using sessionId as teamId')
        teamId = sessionId // Fallback to using sessionId directly
      }
      
      if (!teamId) {
        throw new Error(`No team found for session ${sessionId}`)
      }
      
      // Check if an invitation is already pending for this email
      try {
        const isPending = await invitationService.isInvitationPending(inviteEmail, teamId);
        if (isPending) {
          toast.info("Invitation Already Sent", {
            description: `An invitation has already been sent to ${inviteEmail}.`,
          });
          
          // Reset form and close modal
          setInviteEmail("");
          setMessage("Hi there! I'd like to invite you to join our team on our project management platform.");
          onClose();
          return;
        }
      } catch (error) {
        // Continue even if the check fails - the backend will catch duplicate invitations anyway
        console.warn("Failed to check pending invitation status:", error);
      }
      
      // Use the team service to send the invitation
      const response = await teamService.inviteUserToTeam(teamId, inviteEmail)
      
      toast.success("Invitation Sent", {
        description: `Invitation sent to ${inviteEmail} successfully.`,
      });
      
      // Reset form and close modal
      setInviteEmail("")
      setMessage("Hi there! I'd like to invite you to join our team on our project management platform.")
      onClose()
    } catch (error: any) {
      console.error("Failed to send invitation:", error)
      
      // Handle specific error messages with user-friendly responses
      let errorMessage = error.message || "Failed to send invitation. Please try again.";
      
      if (errorMessage.includes("invitation has already been sent")) {
        errorMessage = `An invitation has already been sent to ${inviteEmail}.`;
      } else if (errorMessage.includes("already a member")) {
        errorMessage = `${inviteEmail} is already a member of this team.`;
      } else if (errorMessage.includes("User not found")) {
        errorMessage = `No user with the email ${inviteEmail} was found in the system.`;
      }
      
      toast.error("Invitation Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function to prevent excessive API calls
  const handleSearchChange = (value: string) => {
    setSearchEmail(value)
    setSelectedUser(null)
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Don't search if less than 3 characters to prevent server overload
    if (value.length < 3) {
      setShowDropdown(false)
      setSearchResults([])
      
      // Show a small hint to the user if they start typing
      if (value.length > 0) {
        setShowDropdown(true)
        setSearchResults([])
        // This will be handled in the UI to show a message
      }
      return
    }
    
    // Set a new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const results = await userService.searchUsers(value)
        setSearchResults(results)
        setShowDropdown(true) // Always show dropdown to display "no results" message if needed
      } catch (error: any) {
        console.error("Error searching users:", error)
        setSearchResults([])
        toast.error("Search Error", {
          description: error.message || "Failed to search for users. Please try again.",
        });
      } finally {
        setIsSearching(false)
      }
    }, 500) // 500ms debounce time
  }
  
  const handleUserSelect = (user: UserType) => {
    // Get current user to check if they're selecting themselves
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      if (currentUser._id === user._id) {
        toast.error("Invalid Selection", {
          description: "You cannot invite yourself to the team.",
        });
        return;
      }
    }
    
    setSelectedUser(user);
    setSearchEmail(user.username);
    setShowDropdown(false);
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error("No User Selected", {
        description: "Please select a user from the search results.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let teamId;
      
      try {
        teamId = await sessionService.getSessionTeam(sessionId);
      } catch (error) {
        console.warn("Could not get team ID from session service:", error);
        teamId = sessionId; // Fallback
      }
      
      if (!teamId) {
        throw new Error(`No team found for session ${sessionId}`);
      }
      
      // Check if already a member
      const teamData = await teamService.getTeamById(teamId);
      const isLeader = teamData.leader._id === selectedUser._id;
      const isMember = teamData.members.some(m => m._id === selectedUser._id);
      
      if (isLeader || isMember) {
        toast.error("Already a Member", {
          description: `${selectedUser.username} is already a member of this team.`,
        });
        return;
      }
      
      // Check for pending invitation
      try {
        const isPending = await invitationService.isInvitationPending(selectedUser.email, teamId);
        if (isPending) {
          toast.info("Invitation Already Sent", {
            description: `An invitation has already been sent to ${selectedUser.username}.`,
          });
          return;
        }
      } catch (error) {
        console.warn("Failed to check pending invitation status:", error);
      }
      
      // Send invitation
      await teamService.inviteUserToTeam(teamId, selectedUser.email);
      
      toast.success("Invitation Sent", {
        description: `Invitation sent to ${selectedUser.username} successfully.`,
      });
      
      // Reset form and close modal
      setSelectedUser(null);
      setSearchEmail("");
      onClose();
    } catch (error: any) {
      console.error("Failed to send invitation:", error);
      toast.error("Invitation Failed", {
        description: error.message || "Failed to send invitation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Invite a new member to join your team</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Invite by Email</TabsTrigger>
            <TabsTrigger value="search">Search Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 pt-4">
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className="pl-8"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your invitation"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!inviteEmail || isLoading}>
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4 pt-4">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by username or email"
                    className="pl-8"
                    value={searchEmail}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                
                {showDropdown && (
                  <div className="border rounded-md mt-1 max-h-[200px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {searchEmail.length < 3 ? "Type at least 3 characters to search" : "No users found"}
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {searchResults.map((user) => (
                          <li
                            key={user._id}
                            className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-muted ${
                              selectedUser?._id === user._id ? "bg-muted" : ""
                            }`}
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="flex-shrink-0">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                            {selectedUser?._id === user._id && <Check className="h-4 w-4 text-primary" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              {selectedUser && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-sm font-medium">Selected User</div>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div>{selectedUser.username}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedUser || isLoading}>
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
