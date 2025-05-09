"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Eye, Search, Trash, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { candidateService, Candidate } from "@/api/candidate-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CandidateMonitorTableProps {
  sessionId: string
}

export function CandidateMonitorTable({ sessionId }: CandidateMonitorTableProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(true)
  
  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Fetch candidates
  const fetchCandidates = async () => {
    if (!isMounted) return;
    
    setLoading(true)
    try {
      console.log("Fetching candidates for session:", sessionId);
      
      const data = await candidateService.getCandidates(sessionId);
      console.log("Received candidates:", data);
      
      // We expect an array, but if we get something else, treat it as empty
      if (Array.isArray(data)) {
        if (isMounted) setCandidates(data);
      } else {
        console.warn("Received non-array data for candidates:", data);
        if (isMounted) setCandidates([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch candidates:", error);
      if (isMounted) setCandidates([]); // Set empty array on error
      
      toast.error("Failed to load candidates. Please try again.");
    } finally {
      if (isMounted) setLoading(false);
    }
  }
  
  useEffect(() => {
    if (sessionId) {
      // Initial fetch
      fetchCandidates();
      
      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        if (!isProcessing && isMounted) { // Don't refresh during processing or if unmounted
          console.log("Auto-refreshing candidates...");
          fetchCandidates();
        }
      }, 30000);
      
      // Clean up interval on component unmount
      return () => clearInterval(refreshInterval);
    }
  }, [sessionId, isProcessing, isMounted]);

  // Add a retry button to allow manual refresh
  const handleRetry = () => {
    if (isMounted && !isProcessing) {
      fetchCandidates();
    }
  };
  
  // Handle removing a candidate
  const handleRemoveCandidate = async (candidateId: string) => {
    if (!candidateId || isProcessing || !isMounted) return;
    
    if (!confirm("Are you sure you want to remove this candidate?")) {
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log("Removing candidate:", candidateId, "from session:", sessionId);
      
      const result = await candidateService.removeCandidate(sessionId, candidateId);
      console.log("Remove result:", result);
      
      toast.success(result?.message || "Candidate removed successfully");
      
      // Update the local state
      setCandidates(prev => prev.filter(candidate => candidate.user._id !== candidateId));
      
      // Close the dialog if it was open
      if (selectedCandidate?.user._id === candidateId) {
        setDetailsDialogOpen(false);
        setSelectedCandidate(null);
      }
    } catch (error: any) {
      console.error("Failed to remove candidate:", error);
      toast.error(error.message || "Failed to remove candidate");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // View candidate details
  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setDetailsDialogOpen(true)
  }
  
  // Filter candidates based on search and status
  const filteredCandidates = candidates.filter(candidate => {
    // Apply status filter
    if (statusFilter !== 'all' && candidate.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        candidate.fullName.toLowerCase().includes(searchLower) ||
        candidate.partyName.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'pending':
      case 'verification pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
      case 'accepted':
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'rejected':
      case 'refused':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Candidates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRetry}
                title="Refresh"
                disabled={loading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`${loading ? 'animate-spin' : ''}`}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M20 16.5A9 9 0 0 1 12 21a9 9 0 0 1-9-9 9 9 0 0 1 16.5-5"></path>
                </svg>
              </Button>
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="verification pending">Verification Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Candidates table */}
          {loading ? (
            <div className="py-8 flex justify-center">
              <p>Loading candidates...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "No candidates match your search or filter criteria" 
                  : "No candidates found for this session"}
              </p>
              <div className="flex flex-col gap-4 items-center">
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Try adjusting your search or filter settings" 
                    : "This could be because no candidates have been approved yet, or there might be an issue connecting to the server."}
                </p>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.user._id}>
                      <TableCell className="font-medium">{candidate.fullName}</TableCell>
                      <TableCell>{candidate.partyName}</TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell>{candidate.totalVotes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(candidate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-700 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleRemoveCandidate(candidate.user._id)}
                            disabled={isProcessing}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedCandidate.fullName}</h3>
                {getStatusBadge(selectedCandidate.status)}
              </div>
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="biography">Biography</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="promises">Promises</TabsTrigger>
                  {selectedCandidate.paper && selectedCandidate.paper.length > 0 && (
                    <TabsTrigger value="papers">Documents</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Party</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {selectedCandidate.partyName}
                      </div>
                    </div>
                    <div>
                      <Label>Nationalities</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {Array.isArray(selectedCandidate.nationalities) 
                          ? selectedCandidate.nationalities.join(', ')
                          : selectedCandidate.nationalities}
                      </div>
                    </div>
                    <div>
                      <Label>Date & Place of Birth</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {selectedCandidate.dobPob}
                      </div>
                    </div>
                    <div>
                      <Label>Total Votes</Label>
                      <div className="mt-1 p-2 border rounded-md font-bold text-lg">
                        {selectedCandidate.totalVotes}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="biography">
                  <div className="space-y-2">
                    <Label>Biography</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {selectedCandidate.biography}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="experience">
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {selectedCandidate.experience}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="promises">
                  <div className="space-y-2">
                    <Label>Promises</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {Array.isArray(selectedCandidate.promises) 
                        ? selectedCandidate.promises.join('\n\n')
                        : selectedCandidate.promises}
                    </div>
                  </div>
                </TabsContent>
                
                {selectedCandidate.paper && selectedCandidate.paper.length > 0 && (
                  <TabsContent value="papers">
                    <div className="space-y-2">
                      <Label>Submitted Documents</Label>
                      <div className="mt-2 space-y-2">
                        {selectedCandidate.paper.map((paper, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <span>{paper.name}</span>
                            <a 
                              href={paper.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </Button>
            
            {selectedCandidate && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleRemoveCandidate(selectedCandidate.user._id);
                }}
                disabled={isProcessing}
              >
                <Trash className="h-4 w-4 mr-2" />
                Remove Candidate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 