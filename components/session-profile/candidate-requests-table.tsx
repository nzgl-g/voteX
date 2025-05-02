"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn-ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Label } from "@/components/shadcn-ui/label"
import { Check, Eye, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/shadcn-ui/badge"
import { candidateService, CandidateRequest } from "@/api/candidate-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"

interface CandidateRequestsTableProps {
  sessionId: string
}

export function CandidateRequestsTable({ sessionId }: CandidateRequestsTableProps) {
  const [requests, setRequests] = useState<CandidateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<CandidateRequest | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(true)
  
  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Fetch candidate requests
  const fetchRequests = async () => {
    if (!isMounted) return;
    
    setLoading(true)
    try {
      console.log("Fetching candidate requests for session:", sessionId);
      
      // Try the optimized fetch with retry logic
      const data = await candidateService.fetchCandidateRequestsWithRetry(sessionId, 3);
      console.log("Received candidate requests:", data);
      
      // We expect an array, but if we get something else, treat it as empty
      if (Array.isArray(data)) {
        if (isMounted) setRequests(data);
      } else {
        console.warn("Received non-array data for candidate requests:", data);
        if (isMounted) setRequests([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch candidate requests:", error);
      if (isMounted) setRequests([]); // Set empty array on error
      
      // Show toast only for real errors, not empty results
      if (error.message !== "Failed to fetch candidate requests") {
        toast.error("Failed to load candidate requests. Please try again.");
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  }
  
  useEffect(() => {
    if (sessionId) {
      // Initial fetch
      fetchRequests();
      
      // Set up periodic refresh every 10 seconds
      const refreshInterval = setInterval(() => {
        if (!isProcessing && isMounted) { // Don't refresh during processing or if unmounted
          console.log("Auto-refreshing candidate requests...");
          fetchRequests();
        }
      }, 10000);
      
      // Clean up interval on component unmount
      return () => clearInterval(refreshInterval);
    }
  }, [sessionId, isProcessing, isMounted]);

  // Add debug logs for key component states
  useEffect(() => {
    console.log("Current candidate requests:", requests);
  }, [requests]);

  useEffect(() => {
    console.log("Selected request:", selectedRequest);
  }, [selectedRequest]);
  
  // Add a retry button to allow manual refresh
  const handleRetry = () => {
    if (isMounted && !isProcessing) {
      fetchRequests();
    }
  };
  
  // Handle accepting a candidate request
  const handleAcceptRequest = async (requestId: string) => {
    if (!requestId || isProcessing || !isMounted) return;
    
    setIsProcessing(true)
    try {
      console.log("Accepting candidate request:", requestId, "for session:", sessionId);
      
      const result = await candidateService.acceptCandidateRequest(sessionId, requestId);
      console.log("Accept result:", result);
      
      toast.success(result?.message || "Candidate request accepted");
      
      // Update the local state
      setRequests(prev => 
        prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'approved', approvedAt: new Date().toISOString() } 
            : req
        )
      );
      
      // Close the dialog if it was open
      if (selectedRequest?._id === requestId) {
        setDetailsDialogOpen(false);
        setSelectedRequest(null);
      }
      
      // Refresh the data after a short delay
      setTimeout(() => {
        fetchRequests();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to accept candidate request:", error);
      
      // Check if it's our "HTML instead of JSON" error
      if (error.message && error.message.includes("HTML instead of JSON")) {
        toast.error("Server communication error. Please refresh the page to see if your changes were applied.");
      } else {
        toast.error(error.message || "Failed to accept candidate request");
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle rejecting a candidate request
  const handleRejectRequest = async (requestId: string) => {
    if (!requestId || isProcessing || !isMounted) return;
    
    setIsProcessing(true);
    try {
      console.log("Rejecting candidate request:", requestId, "for session:", sessionId);
      
      const result = await candidateService.rejectCandidateRequest(sessionId, requestId);
      console.log("Reject result:", result);
      
      toast.success(result?.message || "Candidate request rejected");
      
      // Update the local state
      setRequests(prev => 
        prev.map(req => 
          req._id === requestId 
            ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString() } 
            : req
        )
      );
      
      // Close the dialog if it was open
      if (selectedRequest?._id === requestId) {
        setDetailsDialogOpen(false);
        setSelectedRequest(null);
      }
      
      // Refresh the data after a short delay
      setTimeout(() => {
        fetchRequests();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to reject candidate request:", error);
      
      // Check if it's our "HTML instead of JSON" error
      if (error.message && error.message.includes("HTML instead of JSON")) {
        toast.error("Server communication error. Please refresh the page to see if your changes were applied.");
      } else {
        toast.error(error.message || "Failed to reject candidate request");
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // View candidate details
  const handleViewDetails = (request: CandidateRequest) => {
    setSelectedRequest(request)
    setDetailsDialogOpen(true)
  }
  
  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    // Apply status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.fullName.toLowerCase().includes(searchLower) ||
        request.partyName.toLowerCase().includes(searchLower) ||
        (request.user.fullName && request.user.fullName.toLowerCase().includes(searchLower)) ||
        (request.user.email && request.user.email.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })
  
  // Get status badge color
  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Candidate Requests</CardTitle>
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
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Candidate requests table */}
          {loading ? (
            <div className="py-8 flex justify-center">
              <p>Loading candidate requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "No candidate requests match your search or filter criteria" 
                  : "No candidate requests found for this session"}
              </p>
              <div className="flex flex-col gap-4 items-center">
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Try adjusting your search or filter settings" 
                    : "This could be because no candidates have applied yet, or there might be an issue connecting to the server."}
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
                    <TableHead>Applicant</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{request.fullName}</span>
                          <span className="text-xs text-muted-foreground">{request.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{request.partyName}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && new Date(request.requestedAt).toLocaleDateString()}
                        {request.status === 'approved' && new Date(request.approvedAt || '').toLocaleDateString()}
                        {request.status === 'rejected' && new Date(request.rejectedAt || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 hover:bg-green-100 text-green-700"
                                onClick={() => handleAcceptRequest(request._id)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-700"
                                onClick={() => handleRejectRequest(request._id)}
                                disabled={isProcessing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
            <DialogTitle>Candidate Application Details</DialogTitle>
            <DialogDescription>
              Review the candidate's application information
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedRequest.fullName}</h3>
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="biography">Biography</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="promises">Promises</TabsTrigger>
                  {selectedRequest.papers && selectedRequest.papers.length > 0 && (
                    <TabsTrigger value="papers">Documents</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {selectedRequest.user?.email || 'No email provided'}
                      </div>
                    </div>
                    <div>
                      <Label>Party</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {selectedRequest.partyName}
                      </div>
                    </div>
                    <div>
                      <Label>Nationalities</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {Array.isArray(selectedRequest.nationalities) 
                          ? selectedRequest.nationalities.join(', ')
                          : selectedRequest.nationalities}
                      </div>
                    </div>
                    <div>
                      <Label>Date & Place of Birth</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {selectedRequest.dobPob}
                      </div>
                    </div>
                    <div>
                      <Label>Application Date</Label>
                      <div className="mt-1 p-2 border rounded-md">
                        {new Date(selectedRequest.requestedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="biography">
                  <div className="space-y-2">
                    <Label>Biography</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {selectedRequest.biography}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="experience">
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {selectedRequest.experience}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="promises">
                  <div className="space-y-2">
                    <Label>Promises</Label>
                    <div className="mt-1 p-3 border rounded-md min-h-[200px] whitespace-pre-wrap">
                      {selectedRequest.promises}
                    </div>
                  </div>
                </TabsContent>
                
                {selectedRequest.papers && selectedRequest.papers.length > 0 && (
                  <TabsContent value="papers">
                    <div className="space-y-2">
                      <Label>Submitted Documents</Label>
                      <div className="mt-2 space-y-2">
                        {selectedRequest.papers.map((paper, index) => (
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
            {selectedRequest && selectedRequest.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleRejectRequest(selectedRequest._id)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button 
                  onClick={() => handleAcceptRequest(selectedRequest._id)}
                  disabled={isProcessing}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Application
                </Button>
              </>
            )}
            {selectedRequest && selectedRequest.status !== 'pending' && (
              <Button 
                variant="outline" 
                onClick={() => setDetailsDialogOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 