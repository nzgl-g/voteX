"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Badge } from "@/components/shadcn-ui/badge"
import { Checkbox } from "@/components/shadcn-ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn-ui/alert-dialog"
import { Copy, MoreHorizontal, Search, Filter } from "lucide-react"

interface TeamMember {
  id: string
  username: string
  fullName: string
  email: string
  role: string
  status: string
}

interface TeamMembersTableProps {
  members: TeamMember[]
  selectedMembers: string[]
  onSelectMembers: (selectedIds: string[]) => void
  onRemoveMember: (id: string) => void
  onAssignTask: (id: string) => void
}

export function TeamMembersTable({
  members,
  selectedMembers,
  onSelectMembers,
  onRemoveMember,
  onAssignTask,
}: TeamMembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  const filteredMembers = members.filter(
    (member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      onSelectMembers([])
    } else {
      onSelectMembers(filteredMembers.map((member) => member.id))
    }
  }

  const handleSelectMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      onSelectMembers(selectedMembers.filter((memberId) => memberId !== id))
    } else {
      onSelectMembers([...selectedMembers, id])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedMembers.length > 0 && selectedMembers.length === filteredMembers.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleSelectMember(member.id)}
                      aria-label={`Select ${member.username}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {member.username}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(member.username)}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy username</span>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "Leader" ? "default" : "secondary"}>{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${member.status === "online" ? "bg-green-500" : "bg-gray-300"}`}
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
                        <DropdownMenuItem onClick={() => onAssignTask(member.id)}>Assign Task</DropdownMenuItem>
                        <DropdownMenuItem>Edit Member</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setMemberToRemove(member.id)}>
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the team member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (memberToRemove) {
                  onRemoveMember(memberToRemove)
                  setMemberToRemove(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
