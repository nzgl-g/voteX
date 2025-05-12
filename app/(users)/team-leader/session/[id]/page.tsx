"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import Profile from "@/components/session-profile/profile"
import { CandidateTable } from "@/components/nomination-requests/candidate-table"
import { Session } from "@/services/session-service"
import { CandidateRequest } from "@/services/candidate-service"
import sessionService from "@/services/session-service"
import candidateService from "@/services/candidate-service"
import { Candidate, CandidateStatus, Attachment } from "@/components/nomination-requests/data"
import { toast } from "@/components/ui/use-toast"
import { BarChart, RefreshCw, Blocks, AlertTriangle, BadgeCheck, Loader2 } from "lucide-react"
import { blockchainService } from "@/services/blockchain-service"
import { Button } from "@/components/ui/button"
import { blockchainSyncService } from "@/services/blockchain-sync-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"

// Define types to handle both schema and runtime blockchain fields
interface EnhancedCandidate {
  _id?: string;
  id?: string;
  fullName: string;
  partyName: string;
  totalVotes?: number;
  voteCount?: number;
  blockchainVerified?: boolean;
}

interface EnhancedPollOption {
  _id?: string;
  name: string;
  description?: string;
  totalVotes?: number;
  voteCount?: number;
  blockchainVerified?: boolean;
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [candidateRequests, setCandidateRequests] = useState<CandidateRequest[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingBlockchainData, setLoadingBlockchainData] = useState(false)
  const [blockchainSynced, setBlockchainSynced] = useState(false)
  const [blockchainError, setBlockchainError] = useState<string | null>(null)
  const [isRefreshingBlockchain, setIsRefreshingBlockchain] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Function to fetch vote counts from blockchain
  const fetchBlockchainVoteCounts = async (silent = false) => {
    if (!session?.contractAddress) {
      if (!silent) {
        setBlockchainError("No blockchain contract address available for this session");
        toast({
          title: "Blockchain Sync Error",
          description: "No blockchain contract found for this session",
          variant: "destructive"
        });
      }
      return;
    }
    
    try {
      if (!silent) {
        setLoadingBlockchainData(true);
      }
      setBlockchainError(null);
      
      // Connect to blockchain
      console.log("Connecting to blockchain...");
      const connected = await blockchainService.connect();
      if (!connected) {
        const errorMsg = "Failed to connect to blockchain. Make sure MetaMask is installed and unlocked.";
        console.error(errorMsg);
        setBlockchainError(errorMsg);
        if (!silent) {
          toast({
            title: "Blockchain Connection Error",
            description: errorMsg,
            variant: "destructive"
          });
        }
        return;
      }
      
      // Get vote results from the blockchain
      console.log("Fetching blockchain vote results from contract:", session.contractAddress);
      const blockchainResults = await blockchainService.getVoteResults(session.contractAddress);
      if (!blockchainResults) {
        const errorMsg = "Failed to get blockchain results. The contract may not be accessible.";
        console.error(errorMsg);
        setBlockchainError(errorMsg);
        if (!silent) {
          toast({
            title: "Blockchain Data Error",
            description: errorMsg,
            variant: "destructive"
          });
        }
        return;
      }
      
      console.log("Blockchain results:", blockchainResults);
      
      // Create a copy of the session
      const updatedSession = { ...session } as any;
      
      // Update vote counts in the session based on blockchain data
      if (session.type === 'election' && 'candidates' in session && session.candidates) {
        // Map blockchain participants to candidates
        updatedSession.candidates = session.candidates.map((candidate: any) => {
          // Find the matching participant in blockchain results
          const participantName = candidate.fullName || candidate.partyName;
          const index = blockchainResults.participants.findIndex((p: string) => 
            p === participantName || p === candidate._id
          );
          
          if (index !== -1) {
            // Update vote count from blockchain
            return {
              ...candidate,
              voteCount: blockchainResults.voteCounts[index],
              totalVotes: blockchainResults.voteCounts[index],
              blockchainVerified: true
            };
          }
          
          return candidate;
        });
      } else if (session.type === 'poll' && 'options' in session && session.options) {
        // Map blockchain participants to poll options
        updatedSession.options = session.options.map((option: any) => {
          // Find the matching participant in blockchain results
          const index = blockchainResults.participants.findIndex((p: string) => 
            p === option.name || p === option._id
          );
          
          if (index !== -1) {
            // Update vote count from blockchain
            return {
              ...option,
              voteCount: blockchainResults.voteCounts[index],
              totalVotes: blockchainResults.voteCounts[index],
              blockchainVerified: true
            };
          }
          
          return option;
        });
      }
      
      // Get the total voter count
      console.log("Fetching voter count from blockchain...");
      const voterCount = await blockchainService.getVoterCount(session.contractAddress);
      console.log("Total blockchain voters:", voterCount);
      
      // Add total voter count to session for reference
      updatedSession.blockchainVoterCount = voterCount;
      
      // Update the session
      setSession(updatedSession);
      setBlockchainSynced(true);
      
      // Try to update the backend with blockchain data
      try {
        console.log("Updating backend with blockchain vote counts...");
        
        const voteCountsData = session.type === 'election' && 'candidates' in updatedSession
          ? updatedSession.candidates.map((c: any) => ({ id: c._id, votes: c.voteCount || c.totalVotes || 0 }))
          : 'options' in updatedSession ? updatedSession.options.map((o: any) => ({ id: o._id, votes: o.voteCount || o.totalVotes || 0 })) : [];
          
        await sessionService.updateSessionVoteCounts(sessionId, {
          type: session.type,
          voteCounts: voteCountsData,
          voterCount
        });
        
        if (!silent) {
          toast({
            title: "Complete Sync",
            description: "Vote counts synced from blockchain and updated in the database",
            variant: "default"
          });
        }
      } catch (backendError) {
        console.error("Error updating backend with blockchain data:", backendError);
        if (!silent) {
          toast({
            title: "Partial Sync",
            description: "Vote counts synced from blockchain but failed to update database",
            variant: "default"
          });
        }
      }
      
    } catch (error) {
      console.error("Error fetching blockchain vote counts:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown blockchain error";
      setBlockchainError(errorMsg);
      if (!silent) {
        toast({
          title: "Blockchain Sync Error",
          description: "Failed to sync vote counts from the blockchain: " + errorMsg,
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) {
        setLoadingBlockchainData(false);
      }
    }
  };

  // Set up automatic refresh interval
  useEffect(() => {
    // Run initial fetch when session data is available
    if (session?.contractAddress) {
      fetchBlockchainVoteCounts(true);
    }

    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      if (session?.contractAddress) {
        console.log("Auto-refreshing blockchain data...");
        fetchBlockchainVoteCounts(true);
      }
    }, 15000); // Refresh every 15 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [session?.contractAddress]);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)
        const sessionData = await sessionService.getSessionById(sessionId)
        setSession(sessionData)
        
        setLoading(false)
        
        // Only fetch candidate requests if the session has a nomination phase
        if (sessionData.sessionLifecycle?.scheduledAt?.start && 
            sessionData.sessionLifecycle?.scheduledAt?.end) {
          fetchCandidateRequests()
        }
      } catch (err) {
        console.error("Error fetching session data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch session data")
        setLoading(false)
      }
    }

    const fetchCandidateRequests = async () => {
      try {
        setLoadingCandidates(true)
        const requestsData = await candidateService.getCandidateRequests(sessionId)
        setCandidateRequests(requestsData)
      } catch (candidateErr) {
        console.error("Error fetching candidate requests:", candidateErr)
        // Don't set an error state, just log the error and continue
      } finally {
        setLoadingCandidates(false)
      }
    }

    fetchSessionData()
  }, [sessionId])

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await candidateService.acceptCandidateRequest(sessionId, requestId)
        toast({
          title: "Success",
          description: "Candidate request accepted successfully",
        })
      } else {
        await candidateService.rejectCandidateRequest(sessionId, requestId)
        toast({
          title: "Success",
          description: "Candidate request rejected successfully",
        })
      }
      
      // Refresh candidate requests
      const updatedRequests = await candidateService.getCandidateRequests(sessionId)
      setCandidateRequests(updatedRequests)
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${action} candidate request: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Map CandidateRequest objects to the Candidate interface expected by CandidateTable
  const mapCandidateRequestsToTableFormat = (requests: CandidateRequest[]): Candidate[] => {
    return requests.map(request => ({
      id: request._id,
      fullName: request.fullName || request.user.fullName,
      email: request.user.email,
      dateOfBirth: request.dobPob?.dateOfBirth || 'N/A',
      placeOfBirth: request.dobPob?.placeOfBirth || 'N/A',
      nationalities: request.nationalities || [],
      experience: request.experience || 'N/A',
      biography: request.biography || 'N/A',
      promises: request.promises || [],
      status: request.status as CandidateStatus,
      attachments: request.paper ? [
        { name: "Application Document", size: "N/A", url: request.paper } as Attachment
      ] : []
    }))
  }

  // Check if the session has a nomination phase
  const hasNominationPhase = (): boolean => {
    if (!session) return false;
    
    return !!(
      session.sessionLifecycle?.scheduledAt?.start && 
      session.sessionLifecycle?.scheduledAt?.end
    );
  }

  // Check if we're currently in the nomination period
  const isInNominationPeriod = (): boolean => {
    if (!session || !hasNominationPhase()) return false;
    
    const now = new Date();
    const scheduledAt = session.sessionLifecycle?.scheduledAt;
    if (!scheduledAt || !scheduledAt.start || !scheduledAt.end) {
      return false;
    }
    
    const startDate = new Date(scheduledAt.start);
    const endDate = new Date(scheduledAt.end);
    
    return now >= startDate && now <= endDate;
  }

  // Function to render the results table
  const renderResultsTable = () => {
    if (!session) return null;
    
    if (session.type === 'election' && 'candidates' in session && session.candidates) {
      const candidates = session.candidates as unknown as EnhancedCandidate[];
      const totalVotes = candidates.reduce(
        (sum, candidate) => sum + (candidate.voteCount || candidate.totalVotes || 0), 
        0
      );
      
      return (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Election Results</h2>
            {session.contractAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lastSyncTime && (
                  <span>Last blockchain sync: {lastSyncTime}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Party</th>
                  <th className="px-4 py-2 text-right">Votes</th>
                  <th className="px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => {
                  const voteCount = candidate.voteCount || candidate.totalVotes || 0;
                  const percentage = totalVotes > 0 
                    ? ((voteCount / totalVotes) * 100).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={candidate._id || candidate.id || index} className={index % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-4 py-3 flex items-center gap-2">
                        {candidate.fullName}
                        {candidate.blockchainVerified && (
                          <BadgeCheck className="h-4 w-4 text-green-600" aria-label="Verified on blockchain" />
                        )}
                      </td>
                      <td className="px-4 py-3">{candidate.partyName}</td>
                      <td className="px-4 py-3 text-right font-medium">{voteCount}</td>
                      <td className="px-4 py-3 text-right">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60 font-medium">
                  <td colSpan={2} className="px-4 py-2 text-left">Total</td>
                  <td className="px-4 py-2 text-right">{totalVotes}</td>
                  <td className="px-4 py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    } else if (session.type === 'poll' && 'options' in session && session.options) {
      const options = session.options as unknown as EnhancedPollOption[];
      const totalVotes = options.reduce(
        (sum, option) => sum + (option.voteCount || option.totalVotes || 0), 
        0
      );
      
      return (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Poll Results</h2>
            {session.contractAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lastSyncTime && (
                  <span>Last blockchain sync: {lastSyncTime}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left">Option</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Votes</th>
                  <th className="px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option, index) => {
                  const voteCount = option.voteCount || option.totalVotes || 0;
                  const percentage = totalVotes > 0 
                    ? ((voteCount / totalVotes) * 100).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={option._id || index} className={index % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-4 py-3 flex items-center gap-2">
                        {option.name}
                        {option.blockchainVerified && (
                          <BadgeCheck className="h-4 w-4 text-green-600" aria-label="Verified on blockchain" />
                        )}
                      </td>
                      <td className="px-4 py-3">{option.description || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">{voteCount}</td>
                      <td className="px-4 py-3 text-right">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60 font-medium">
                  <td colSpan={2} className="px-4 py-2 text-left">Total</td>
                  <td className="px-4 py-2 text-right">{totalVotes}</td>
                  <td className="px-4 py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <>
        <SiteHeader title="Session Management" />
        <main className="min-h-screen bg-background p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Loading session data...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SiteHeader title="Session Management" />
        <main className="min-h-screen bg-background p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-red-500">Error: {error}</p>
              <button
                onClick={() => router.refresh()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Refresh
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <SiteHeader title="Session Management" />
        <main className="min-h-screen bg-background p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-lg">Session not found</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="Session Management" />
      <main className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => router.push(`/team-leader/monitoring/${sessionId}`)}
                className="flex items-center gap-2"
              >
                <BarChart className="h-4 w-4" />
                <span>View Analytics</span>
              </Button>
            </div>
          </div>
          
          {blockchainSynced && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center gap-2">
              <Blocks className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Blockchain data synchronized</p>
                <p className="text-sm">Total voters on blockchain: {(session as any).blockchainVoterCount || 0}</p>
                <p className="text-xs text-green-600">Data refreshes automatically every 15 seconds</p>
              </div>
            </div>
          )}
          
          {blockchainError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">Blockchain sync error</p>
                <p className="text-sm">{blockchainError}</p>
              </div>
            </div>
          )}

          <Profile session={session} onUpdate={setSession} />

          {hasNominationPhase() && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-2">Nomination Requests</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {isInNominationPeriod() 
                  ? "Review and manage candidate nomination requests for this session."
                  : "The nomination period is not currently active."}
              </p>
              
              {loadingCandidates ? (
                <p className="text-sm text-muted-foreground">Loading candidate requests...</p>
              ) : candidateRequests.length > 0 ? (
                <CandidateTable 
                  candidates={mapCandidateRequestsToTableFormat(candidateRequests)}
                  onAccept={(id) => handleRequestAction(id, 'accept')}
                  onReject={(id) => handleRequestAction(id, 'reject')}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No candidate requests found.</p>
              )}
            </div>
          )}
          
          {/* Results table */}
          {(session.sessionLifecycle?.startedAt || session.contractAddress) && renderResultsTable()}
        </div>
      </main>
    </>
  )
}
