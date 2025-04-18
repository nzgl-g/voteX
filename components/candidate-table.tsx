"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn-ui/dropdown-menu"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Badge } from "@/components/shadcn-ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { ChevronDown, ChevronUp, Filter, Search, UserCheck, UserX, Clock, Eye, UserPlus } from "lucide-react"
import type { Candidate, TeamMember } from "@/lib/types"

interface CandidatesTableProps {
    candidates: Candidate[]
    teamMembers: TeamMember[]
}

type SortField = "fullName" | "status" | "partyName" | "totalVotes"
type SortDirection = "asc" | "desc"

export default function CandidatesTable({ candidates, teamMembers }: CandidatesTableProps) {
    const [sortField, setSortField] = useState<SortField>("fullName")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [localCandidates, setLocalCandidates] = useState<Candidate[]>(candidates)
    const itemsPerPage = 5

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const handleAssignReviewer = (candidateId: string, reviewerId: string) => {
        const reviewer = teamMembers.find((r) => r.id === reviewerId) // ✅ changed
        if (!reviewer) return

        setLocalCandidates((prev) =>
            prev.map((candidate) =>
                candidate.id === candidateId
                    ? {
                        ...candidate,
                        assignedReviewer: reviewer,
                        requiresReview: false,
                    }
                    : candidate,
            ),
        )
    }

    const filteredCandidates = localCandidates.filter((candidate) => {
        const matchesSearch =
            searchTerm === "" ||
            candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (candidate.assignedReviewer?.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter ? candidate.status === statusFilter : true

        return matchesSearch && matchesStatus
    })

    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
        if (sortField === "totalVotes") {
            return sortDirection === "asc" ? a.totalVotes - b.totalVotes : b.totalVotes - a.totalVotes
        }

        const aValue = a[sortField].toString().toLowerCase()
        const bValue = b[sortField].toString().toLowerCase()

        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    })

    const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedCandidates = sortedCandidates.slice(startIndex, startIndex + itemsPerPage)

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "Verified":
                return (
                    <Badge className="bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-300">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Verified
                    </Badge>
                )
            case "Refused":
                return (
                    <Badge className="bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-300">
                        <UserX className="h-3 w-3 mr-1" />
                        Refused
                    </Badge>
                )
            case "Pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search candidates..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            {statusFilter || "All Statuses"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Statuses</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Verified")}>Verified</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Refused")}>Refused</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("fullName")}>
                                <div className="flex items-center">
                                    Candidate Name
                                    {sortField === "fullName" && (
                                        sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                                <div className="flex items-center">
                                    Status
                                    {sortField === "status" && (
                                        sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort("partyName")}>
                                <div className="flex items-center">
                                    Party
                                    {sortField === "partyName" && (
                                        sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hidden sm:table-cell" onClick={() => handleSort("totalVotes")}>
                                <div className="flex items-center">
                                    Votes
                                    {sortField === "totalVotes" && (
                                        sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">Assigned Reviewer</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCandidates.length > 0 ? (
                            paginatedCandidates.map((candidate) => (
                                <TableRow key={candidate.id} className="h-16">
                                    <TableCell className="font-medium">{candidate.fullName}</TableCell>
                                    <TableCell>{renderStatusBadge(candidate.status)}</TableCell>
                                    <TableCell className="hidden md:table-cell">{candidate.partyName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {candidate.totalVotes > 0 ? candidate.totalVotes.toLocaleString() : "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {candidate.assignedReviewer ? (
                                            <div className="flex flex-col">
                                                <span>{candidate.assignedReviewer.fullName}</span>
                                                <span className="text-xs text-muted-foreground">{candidate.assignedReviewer.role}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <span className="text-muted-foreground mr-2">Not assigned</span>
                                                {candidate.status === "Pending" && (
                                                    <Select onValueChange={(value) => handleAssignReviewer(candidate.id, value)}>
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Assign reviewer" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {teamMembers.map((reviewer) => (
                                                                <SelectItem key={reviewer.id} value={reviewer.id}>
                                                                    {reviewer.fullName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Link href={`/candidates/${candidate.id}`} passHref>
                                                <Button variant="outline" size="sm" className="h-8">
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    View Profile
                                                </Button>
                                            </Link>
                                            {!candidate.assignedReviewer && candidate.status === "Pending" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 md:hidden">
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {teamMembers.map((reviewer) => (
                                                            <DropdownMenuItem
                                                                key={reviewer.id}
                                                                onClick={() => handleAssignReviewer(candidate.id, reviewer.id)}
                                                            >
                                                                {reviewer.fullName}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    No candidates found matching your criteria
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCandidates.length)} of{" "}
                        {filteredCandidates.length}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
