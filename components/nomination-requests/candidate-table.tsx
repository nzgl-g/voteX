"use client"

import { useState } from "react"
import { Eye, Search, Filter, FileDown, CheckCircle, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/nomination-requests/status-badge"
import { CandidateDialog } from "@/components/nomination-requests/candidate-dialog"
import type { Candidate } from "@/components/nomination-requests/data"

interface CandidateTableProps {
  candidates: Candidate[]
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
}

export function CandidateTable({ candidates, onAccept, onReject }: CandidateTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    status: true,
    actions: true,
  })
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setDialogOpen(true)
  }

  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredCandidates.map((c) => [c.fullName, c.email, c.status].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "candidates.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={visibleColumns.name} onCheckedChange={() => toggleColumn("name")}>
                Full Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.email} onCheckedChange={() => toggleColumn("email")}>
                Email
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={() => toggleColumn("status")}>
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.actions}
                onCheckedChange={() => toggleColumn("actions")}
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.name && <TableHead>Full Name</TableHead>}
              {visibleColumns.email && <TableHead>Email</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-6">
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id || `candidate-${Math.random().toString(36).substring(2, 11)}`}>
                  {visibleColumns.name && <TableCell className="font-medium">{candidate.fullName}</TableCell>}
                  {visibleColumns.email && <TableCell>{candidate.email}</TableCell>}
                  {visibleColumns.status && (
                    <TableCell>
                      <StatusBadge status={candidate.status} />
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCandidate(candidate)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                        
                        {candidate.status === "pending" && onAccept && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:text-green-600 hover:bg-green-50"
                            onClick={() => onAccept(candidate.id)}
                            title="Accept Candidate"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Accept</span>
                          </Button>
                        )}
                        
                        {candidate.status === "pending" && onReject && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onReject(candidate.id)}
                            title="Reject Candidate"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCandidate && (
        <CandidateDialog 
          candidate={selectedCandidate} 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
    </div>
  )
}
