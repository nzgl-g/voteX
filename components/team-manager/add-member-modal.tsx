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
import { userService, User as UserType } from "@/services/user-service"
import { invitationService } from "@/services/invitation-service"
import { useTeam } from "./team-context"
import baseApi from "@/services/base-api"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
  const { sessionId, teamId, fetchTeamMembers } = useTeam()
  
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
      // Use teamId from context if available, otherwise get it from the session
      const targetTeamId = teamId;
      
      if (!targetTeamId) {
        toast.error("Team Error", {
          description: "No team ID found. Please try again or contact support.",
        });
        return;
      }
      
      // Direct API call to match server expectations
      // Server expects a POST to /teams/:teamId/invite with email in the body
      const response = await baseApi.post(`/teams/${targetTeamId}/invite`, {
        email: inviteEmail,
        message: message, // Include the custom message
        extraData: {
          sessionId: sessionId,
          teamId: targetTeamId
        }
      });
      
      toast.success("Invitation Sent", {
        description: `Invitation sent to ${inviteEmail} successfully.`,
      });
      
      // Refresh team members
      fetchTeamMembers();
      
      // Reset form and close modal
      setInviteEmail("");
      setMessage("Hi there! I'd like to invite you to join our team on our project management platform.");
      onClose();
    } catch (error: any) {
      console.error("Failed to send invitation:", error);
      
      // Handle specific error messages with user-friendly responses
      let errorMessage = "Failed to send invitation. Please try again.";
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data;
      }
      
      if (errorMessage.includes("invitation has already been sent") || 
          errorMessage.includes("Pending invitation already exists")) {
        errorMessage = `An invitation has already been sent to ${inviteEmail}.`;
      } else if (errorMessage.includes("already a member") || 
                errorMessage.includes("already part of the team")) {
        errorMessage = `${inviteEmail} is already a member of this team.`;
      } else if (errorMessage.includes("User not found")) {
        errorMessage = `No user with the email ${inviteEmail} was found in the system.`;
      }
      
      toast.error("Invitation Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
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
    setInviteEmail(user.email);
    setSearchEmail(user.username);
    setShowDropdown(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new team member to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="email">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="email">Invite by Email</TabsTrigger>
            <TabsTrigger value="search">Search Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <form className="space-y-4" onSubmit={handleInviteSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Enter a message to include with the invitation"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Note: Message will be sent as a notification to the user.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !inviteEmail}>
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="search">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by username or email"
                    value={searchEmail}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                  
                  {showDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {isSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm">Searching...</span>
                        </div>
                      ) : searchEmail.length < 3 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Enter at least 3 characters to search
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          No users found matching "{searchEmail}"
                        </div>
                      ) : (
                        <div className="max-h-52 overflow-auto py-1">
                          {searchResults.map((user) => (
                            <div
                              key={user._id}
                              className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-accent"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{user.username}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                              {selectedUser && selectedUser._id === user._id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedUser && (
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedUser.username}</div>
                        <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  disabled={isLoading || !selectedUser}
                  onClick={(e) => {
                    if (selectedUser) {
                      handleInviteSubmit(e as any)
                    }
                  }}
                >
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
