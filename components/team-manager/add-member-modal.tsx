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
import { toast } from "@/components/ui/use-toast"
import { Search, Mail, User, Check } from "lucide-react"
import { teamService } from "@/api/team-service"
import { sessionService } from "@/api/session-service"
import { userService, User as UserType } from "@/api/user-service"
import { invitationService } from "@/api/invitation-service"

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
        toast({
          title: "Invalid Email",
          description: "You cannot invite yourself to the team.",
          variant: "destructive",
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
          toast({
            title: "Invitation Already Sent",
            description: `An invitation has already been sent to ${inviteEmail}.`,
            variant: "default",
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
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} successfully.`,
        variant: "default",
      })
      
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
      
      toast({
        title: "Invitation Failed",
        description: errorMessage,
        variant: "destructive",
      })
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
        toast({
          title: "Search Error",
          description: error.message || "Failed to search for users. Please try again.",
          variant: "destructive",
        })
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
        toast({
          title: "Invalid Selection",
          description: "You cannot invite yourself to the team.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSelectedUser(user)
    setSearchEmail(user.email)
    setShowDropdown(false)
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !sessionId) {
      toast({
        title: "Selection Required",
        description: "Please select a user from the search results.",
        variant: "destructive",
      })
      return
    }
    
    // Double-check that user isn't inviting themselves
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      if (currentUser._id === selectedUser._id || currentUser.email === selectedUser.email) {
        toast({
          title: "Invalid Selection",
          description: "You cannot invite yourself to the team.",
          variant: "destructive",
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
      
      // Check if an invitation is already pending for this user
      try {
        const isPending = await invitationService.isInvitationPending(selectedUser.email, teamId);
        if (isPending) {
          toast({
            title: "Invitation Already Sent",
            description: `An invitation has already been sent to ${selectedUser.username}.`,
            variant: "default",
          });
          
          // Reset form and close modal
          setSearchEmail("");
          setSelectedUser(null);
          setSearchResults([]);
          onClose();
          return;
        }
      } catch (error) {
        // Continue even if the check fails - the backend will catch duplicate invitations anyway
        console.warn("Failed to check pending invitation status:", error);
      }
      
      // Use the team service to send the invitation
      const response = await teamService.inviteUserToTeam(teamId, selectedUser.email)
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${selectedUser.username} successfully.`,
        variant: "default",
      })
      
      // Reset form and close modal
      setSearchEmail("")
      setSelectedUser(null)
      setSearchResults([])
      onClose()
    } catch (error: any) {
      console.error("Failed to send invitation:", error)
      
      // Handle specific error messages with user-friendly responses
      let errorMessage = error.message || "Failed to send invitation. Please try again.";
      
      if (errorMessage.includes("invitation has already been sent")) {
        errorMessage = `An invitation has already been sent to ${selectedUser.username}.`;
      } else if (errorMessage.includes("already a member")) {
        errorMessage = `${selectedUser.username} is already a member of this team.`;
      }
      
      toast({
        title: "Invitation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Invite someone to join your team or search for existing users.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Invitation</TabsTrigger>
            <TabsTrigger value="invite">Invite via Email</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <form onSubmit={handleSearchSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search-email">Search by email</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-email"
                    placeholder="Search by email or username (min 3 chars)"
                    className="pl-8"
                    type="text"
                    value={searchEmail}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    required
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  )}
                  
                  {/* User search results dropdown */}
                  {showDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                      <ul className="max-h-60 overflow-auto py-1 text-sm">
                        {isSearching ? (
                          <li className="flex items-center justify-center px-3 py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <span className="ml-2">Searching...</span>
                          </li>
                        ) : searchEmail.length < 3 ? (
                          <li className="flex items-center px-3 py-4 text-muted-foreground">
                            Please enter at least 3 characters to search
                          </li>
                        ) : searchResults.length === 0 ? (
                          <li className="flex items-center px-3 py-4 text-muted-foreground">
                            No users found. Try a different search term.
                          </li>
                        ) : (
                          searchResults.map((user) => (
                            <li
                              key={user._id}
                              className={`flex cursor-pointer items-center px-3 py-2 hover:bg-gray-100 ${selectedUser?._id === user._id ? 'bg-gray-50' : ''}`}
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                {user.profilePic ? (
                                  <img src={user.profilePic} alt={user.username} className="h-8 w-8 rounded-full" />
                                ) : (
                                  <User className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{user.fullName || user.username}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              {selectedUser?._id === user._id && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !selectedUser}>
                  {isLoading ? "Sending..." : "Send Join Request"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="invite">
            <form onSubmit={handleInviteSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    placeholder="Enter email address"
                    className="pl-8"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Invitation message</Label>
                <Textarea
                  id="message"
                  placeholder="Write a custom message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
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
