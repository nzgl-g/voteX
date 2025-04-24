"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn-ui/dropdown-menu"
import { Button } from "@/components/shadcn-ui/button"
import { Checkbox } from "@/components/shadcn-ui/checkbox"
import { Badge } from "@/components/shadcn-ui/badge"
import { Edit, Bell, MoreHorizontal, CheckSquare, Search, UserPlus } from "lucide-react"
import { EditMemberDialog } from "@/components/team-manager/edit-member-dialog"
import { AssignTaskDialog } from "@/components/team-manager/assign-task-dialog"
import { KnockDialog } from "@/components/team-manager/knock-dialog"
import { AddMemberDialog } from "@/components/team-manager/add-member-dialog"
import { Input } from "@/components/shadcn-ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"

// Mock data for team members
const teamMembers = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Team Leader",
    email: "alex@example.com",
    status: "online",
  },
  {
    id: "2",
    name: "Sarah Williams",
    role: "Validator",
    email: "sarah@example.com",
    status: "offline",
  },
  {
    id: "3",
    name: "Michael Brown",
    role: "Support",
    email: "michael@example.com",
    status: "online",
  },
  {
    id: "4",
    name: "Emily Davis",
    role: "Auditor",
    email: "emily@example.com",
    status: "offline",
  },
  {
    id: "5",
    name: "David Wilson",
    role: "Validator",
    email: "david@example.com",
    status: "online",
  },
]

export default function TeamMembersList() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [editMember, setEditMember] = useState<any | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showKnockDialog, setShowKnockDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const toggleSelectAll = () => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(teamMembers.map((member) => member.id))
    }
  }

  const toggleSelectMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((memberId) => memberId !== id))
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  const handleEdit = (member: any) => {
    setEditMember(member)
    setShowEditDialog(true)
  }

  const handleBulkAction = (action: string) => {
    if (action === "edit" && selectedMembers.length === 1) {
      const member = teamMembers.find((m) => m.id === selectedMembers[0])
      if (member) handleEdit(member)
    } else if (action === "knock") {
      setShowKnockDialog(true)
    } else if (action === "assign") {
      setShowAssignDialog(true)
    }
  }

  // Get unique roles for filter
  const roles = [...new Set(teamMembers.map((member) => member.role))]

  // Filter members based on search and role filter
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
        searchTerm === "" ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search members..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {selectedMembers.length > 0
                ? `${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""} selected`
                : `${filteredMembers.length} members total`}
          </div>
          <div className="flex items-center gap-2">
            {selectedMembers.length > 0 && (
                <>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("edit")}
                      disabled={selectedMembers.length !== 1}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("knock")}>
                    <Bell className="h-4 w-4 mr-2" />
                    Knock
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("assign")}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Assign Task
                  </Button>
                </>
            )}
          </div>
        </div>

        <div className="rounded-md border overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Checkbox
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => toggleSelectMember(member.id)}
                              aria-label={`Select ${member.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div
                                className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                    member.status === "online" ? "bg-green-500" : "bg-gray-400"
                                }`}
                            ></div>
                            <span className="capitalize">{member.status}</span>
                          </div>
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(member)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMembers([member.id])
                                    setShowKnockDialog(true)
                                  }}
                              >
                                <Bell className="h-4 w-4 mr-2" />
                                Knock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMembers([member.id])
                                    setShowAssignDialog(true)
                                  }}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Assign Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                  ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No members found matching your search criteria.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialogs */}
        <EditMemberDialog open={showEditDialog} onOpenChange={setShowEditDialog} member={editMember} />

        <AssignTaskDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            memberIds={selectedMembers}
            members={teamMembers.filter((m) => selectedMembers.includes(m.id))}
        />

        <KnockDialog
            open={showKnockDialog}
            onOpenChange={setShowKnockDialog}
            memberIds={selectedMembers}
            members={teamMembers.filter((m) => selectedMembers.includes(m.id))}
        />

        <AddMemberDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
        />
      </div>
  )
}