"use client"

import React, { useState } from "react"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Sidebar, SidebarProvider, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/shadcn-ui/sidebar"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { useToast } from "@/components/shadcn-ui/use-toast"

// Mock data for demo purposes
const MOCK_USER_ID = "user123"
const MOCK_TEAM = {
  id: "team1",
  name: "Engineering Team",
  description: "Frontend and backend development team",
  members: [
    { id: "user1", name: "Alice Johnson", role: "Team Lead" }
  ]
}

export default function TeamInvitationsPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, this would call an API endpoint to send an invitation
    // For demo, we'll just show a toast
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${email}`,
    })
    
    setEmail("")
  }
  
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center">
              <h1 className="text-xl font-bold ml-2">VoteX</h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Dashboard</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Sessions</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={true}>Teams</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Voting</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-2">
              <Button variant="outline" className="w-full">Logout</Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 flex flex-col">
          <SiteHeader title="Team Management" userId={MOCK_USER_ID} />
          
          <main className="flex-1 p-4 overflow-auto">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{MOCK_TEAM.name}</CardTitle>
                  <CardDescription>{MOCK_TEAM.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Team Members</h3>
                      <ul className="space-y-2">
                        {MOCK_TEAM.members.map(member => (
                          <li key={member.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Invite New Member</h3>
                      <form onSubmit={handleInviteUser} className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="Enter email address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit">Send Invitation</Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    Team members will be notified via email and in-app notifications
                  </p>
                </CardFooter>
              </Card>
              
              <div className="bg-muted p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">How Team Invitations Work</h2>
                <ul className="space-y-2 list-disc pl-5">
                  <li>When a team leader sends an invitation, the recipient receives a notification</li>
                  <li>The notification appears in the bell icon in the header</li>
                  <li>Recipients can accept or decline invitations directly from the notification drawer</li>
                  <li>When accepted, the user is immediately added to the team</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg bg-yellow-50">
                <h3 className="font-bold">Demo Instructions</h3>
                <p>
                  To see the team invitation flow in action:
                </p>
                <ol className="list-decimal pl-5 mt-2">
                  <li>Click the bell icon in the header</li>
                  <li>Team invitations will appear with Accept/Decline buttons</li>
                  <li>In a real app, notifications would arrive in real-time via WebSockets</li>
                </ol>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
} 