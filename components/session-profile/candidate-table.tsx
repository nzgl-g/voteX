"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn-ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Label } from "@/components/shadcn-ui/label"
import type { CandidateStatus } from "./vote-session-management"
import { Plus, Search, Trash, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Candidate {
  id: string
  fullName: string
  email: string
  status: CandidateStatus
}

interface CandidateTableProps {
  candidates: Candidate[]
  onUpdate: (candidates: Candidate[]) => void
  isNominationActive: boolean
}

export function CandidateTable({ candidates, onUpdate, isNominationActive }: CandidateTableProps) {
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
  const [newCandidate, setNewCandidate] = useState<Omit<Candidate, "id">>({
    fullName: "",
    email: "",
    status: "Pending",
  })

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

  const handleAddCandidate = () => {
    if (!newCandidate.fullName.trim() || !newCandidate.email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newCandidate.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const newId = `cand${Date.now()}`
    const updatedCandidates = [...candidateList, { id: newId, ...newCandidate }]

    setCandidateList(updatedCandidates)
    onUpdate(updatedCandidates)
    setNewCandidate({
      fullName: "",
      email: "",
      status: "Pending",
    })
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
        <CardTitle className="text-xl font-bold">Candidates</CardTitle>
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
                    value={newCandidate.fullName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newCandidate.status}
                    onValueChange={(value) =>
                      setNewCandidate({
                        ...newCandidate,
                        status: value as CandidateStatus,
                      })
                    }
                  >
                    <SelectTrigger id="status">
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
                      setCurrentCandidate({
                        ...currentCandidate,
                        status: value as CandidateStatus,
                      })
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
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No candidates found. Add your first candidate or adjust your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>{candidate.fullName}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            candidate.status === "Accepted"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : candidate.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              // In a real app, this would navigate to a profile page
                              toast({
                                title: "View Profile",
                                description: `Viewing profile for ${candidate.fullName}`,
                              })
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                          {isNominationActive && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCandidate(candidate.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
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
