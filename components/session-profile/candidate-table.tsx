"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { CandidateStatus } from "./vote-session-management"
import { Plus, Search, Trash, User, UserPlus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Candidate {
  id: string
  fullName: string
  email: string
  status: CandidateStatus
}

interface CandidateTableProps {
  candidates: Candidate[]
  isEditing: boolean
  isNominationActive: boolean
  onUpdate: (candidates: Candidate[]) => void
}

export function CandidateTable({ candidates, isEditing, isNominationActive, onUpdate }: CandidateTableProps) {
  const [candidateList, setCandidateList] = useState<Candidate[]>(candidates)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "All">("All")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Candidate
    direction: "ascending" | "descending"
  } | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null)
  const [newFullName, setNewFullName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Sorting function
  const requestSort = (key: keyof Candidate) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering, and searching
  const getFilteredCandidates = () => {
    let filteredCandidates = [...candidateList]

    // Apply status filter
    if (statusFilter !== "All") {
      filteredCandidates = filteredCandidates.filter((candidate) => candidate.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filteredCandidates = filteredCandidates.filter(
        (candidate) =>
          candidate.fullName.toLowerCase().includes(lowerCaseSearchTerm) ||
          candidate.email.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    // Apply sorting
    if (sortConfig) {
      filteredCandidates.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredCandidates
  }

  // Update parent component when candidate list changes, but only when not currently in update cycle
  useEffect(() => {
    if (isEditing && !isUpdating) {
      onUpdate(candidateList)
    }
  }, [candidateList, isEditing, onUpdate, isUpdating])

  // Update the candidate list when the candidates prop changes
  useEffect(() => {
    // Only update if the arrays are different (deep comparison)
    if (JSON.stringify(candidates) !== JSON.stringify(candidateList)) {
      setCandidateList(candidates)
    }
  }, [candidates])

  // Create a memoized function to handle candidate status changes
  const handleCandidateStatusChange = (candidateId: string, newStatus: CandidateStatus) => {
    // Prevent update loops
    setIsUpdating(true)
    
    const updatedCandidates = candidateList.map((c) =>
      c.id === candidateId ? { ...c, status: newStatus } : c
    )
    
    setCandidateList(updatedCandidates)
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsUpdating(false)
      // Explicitly call onUpdate after state has been updated
      if (isEditing) {
        onUpdate(updatedCandidates)
      }
    }, 0)
  }

  const handleAddCandidate = () => {
    if (!newFullName.trim() || !newEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and email for the candidate.",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      })
      return
    }

    const newCandidate = {
      id: `candidate-${Date.now()}`,
      fullName: newFullName,
      email: newEmail,
      status: "Accepted" as CandidateStatus,
    }

    setCandidateList([...candidateList, newCandidate])
    setNewFullName("")
    setNewEmail("")
    setIsAddDialogOpen(false)

    toast({
      title: "Candidate added",
      description: "New candidate has been added successfully.",
    })
  }

  const handleEditCandidate = () => {
    if (!currentCandidate) return

    if (!currentCandidate.fullName.trim() || !currentCandidate.email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(currentCandidate.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const updatedCandidates = candidateList.map((candidate) =>
      candidate.id === currentCandidate.id ? currentCandidate : candidate,
    )

    setCandidateList(updatedCandidates)
    onUpdate(updatedCandidates)
    setCurrentCandidate(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Candidate updated",
      description: "Candidate information has been updated successfully.",
    })
  }

  const handleDeleteCandidate = (id: string) => {
    const updatedCandidates = candidateList.filter((candidate) => candidate.id !== id)

    setCandidateList(updatedCandidates)
    onUpdate(updatedCandidates)

    toast({
      title: "Candidate deleted",
      description: "Candidate has been removed successfully.",
    })
  }

  const filteredCandidates = getFilteredCandidates()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          Candidates 
          {isNominationActive && <Badge className="ml-2 bg-green-500">Nomination Active</Badge>}
        </CardTitle>
        {isNominationActive && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Enter candidate name"
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter candidate email"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCandidate}>Add Candidate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Candidate</DialogTitle>
            </DialogHeader>
            {currentCandidate && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editFullName">Full Name</Label>
                  <Input
                    id="editFullName"
                    value={currentCandidate.fullName}
                    onChange={(e) =>
                      setCurrentCandidate({
                        ...currentCandidate,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={currentCandidate.email}
                    onChange={(e) =>
                      setCurrentCandidate({
                        ...currentCandidate,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={currentCandidate.status}
                    onValueChange={(value) =>
                      handleCandidateStatusChange(currentCandidate.id, value as CandidateStatus)
                    }
                  >
                    <SelectTrigger id="editStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Refused">Refused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCandidate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CandidateStatus | "All")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refused">Refused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("fullName")}>
                    Full Name
                    {sortConfig?.key === "fullName" && (
                      <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("email")}>
                    Email
                    {sortConfig?.key === "email" && (
                      <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                    Status
                    {sortConfig?.key === "status" && (
                      <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  {isEditing && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditing ? 4 : 3} className="text-center text-muted-foreground h-32">
                      {isNominationActive ? (
                        <div className="flex flex-col items-center">
                          <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p>Nominations are open. Waiting for candidates to join.</p>
                        </div>
                      ) : isEditing ? (
                        <div className="flex flex-col items-center">
                          <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p>No candidates added yet. Add your first candidate above.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p>No candidates available for this session.</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>{candidate.fullName}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={candidate.status}
                            onValueChange={(value) =>
                              handleCandidateStatusChange(candidate.id, value as CandidateStatus)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Accepted">Accepted</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Refused">Refused</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              candidate.status === "Accepted"
                                ? "default"
                                : candidate.status === "Pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {candidate.status}
                          </Badge>
                        )}
                      </TableCell>
                      {isEditing && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCandidate(candidate.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
