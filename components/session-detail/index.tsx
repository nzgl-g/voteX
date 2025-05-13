"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Clock, Users, BarChart, Calendar, Vote, UserPlus, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CandidateTable } from "@/components/nomination-requests/candidate-table"
import { Candidate as NominationCandidate } from "@/components/nomination-requests/data"
import sessionService, { Session, Election, Poll, Candidate, PollOption } from "@/services/session-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { BlockchainSync } from "@/components/voter-portal/blockchain-sync"

interface SessionDetailProps {
  sessionId: string
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editSection, setEditSection] = useState<'details' | 'settings' | null>(null)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)
        const data = await sessionService.getSessionById(sessionId)
        setSession(data)
        setError(null)

        // Log session vote metadata for blockchain deployment
        try {
          const voteMetadata = await sessionService.getVoteMetadata(sessionId)
          console.log('Vote Metadata loaded:', voteMetadata)
          
          // Also log blockchain deployment data for reference
          const blockchainData = await sessionService.getBlockchainDeploymentData(sessionId)
          console.log('Blockchain Deployment Data:', blockchainData)
        } catch (metadataErr) {
          console.error('Failed to load vote metadata:', metadataErr)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load session data")
        toast.error(err.message || "Failed to load session data")
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const getSessionStatus = (): { status: string; label: string; color: string } => {
    if (!session || !session.sessionLifecycle) {
      return {
        status: "unknown",
        label: "Unknown",
        color: "bg-muted text-muted-foreground",
      }
    }

    const now = new Date()
    const scheduledStart = session.sessionLifecycle.scheduledAt?.start
      ? new Date(session.sessionLifecycle.scheduledAt.start)
      : null
    const scheduledEnd = session.sessionLifecycle.scheduledAt?.end
      ? new Date(session.sessionLifecycle.scheduledAt.end)
      : null
    const startedAt = session.sessionLifecycle.startedAt
      ? new Date(session.sessionLifecycle.startedAt)
      : null
    const endedAt = session.sessionLifecycle.endedAt
      ? new Date(session.sessionLifecycle.endedAt)
      : null

    // Check if session has been marked as ended
    if (session.sessionLifecycle.endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-800 text-zinc-200",
      }
    }

    // Check if session has ended based on scheduled end time
    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-800 text-zinc-200",
      }
    }

    // Check if session has a contract address but also has an endedAt timestamp
    // This indicates an ended blockchain session
    if (session.contractAddress && endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-800 text-zinc-200",
      }
    }

    // Check if session has a contract address (next priority)
    if (session.contractAddress) {
      return {
        status: "started",
        label: "Active",
        color: "bg-emerald-600 text-white",
      }
    }

    // Check if session has started by startedAt field
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      // If it has started but no contract address yet
      return {
        status: "pending_deployment",
        label: "Pending Deployment",
        color: "bg-amber-500 text-black dark:text-zinc-900",
      }
    }

    // Check for nomination phase (for election type)
    if (session.type === "election" && scheduledStart && scheduledEnd) {
      if (now >= scheduledStart && now <= scheduledEnd) {
        return {
          status: "nomination",
          label: "Nominations",
          color: "bg-amber-500 text-black dark:text-zinc-900",
        }
      }
    }

    // Default to coming soon
    return {
      status: "upcoming",
      label: "Coming Soon",
      color: "bg-blue-500 text-white",
    }
  }

  const getSessionVisibility = () => {
    return session?.secretPhrase ? "Private" : "Public";
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  const handleStartSession = async () => {
    // Use a unique ID for the toast to allow updates
    const toastId = "start-session-" + (session?._id || Date.now());
    
    try {
      if (!session || !session._id) return;
      
      // Initialize the loading state
      toast.loading("Connecting to blockchain...", { id: toastId });
      
      try {
        // First make sure session has candidates or options
        let hasParticipants = false;
        if (session && session.type) {
          if (session.type === 'election') {
            const electionSession = session as Election;
            hasParticipants = Array.isArray(electionSession.candidates) && electionSession.candidates.length > 0;
          } else if (session.type === 'poll') {
            const pollSession = session as Poll;
            hasParticipants = Array.isArray(pollSession.options) && pollSession.options.length > 0;
          }
        }
        
        if (!hasParticipants) {
          toast.error("Session must have candidates or options before it can be started", { id: toastId });
          return;
        }
        
        // Check if session already has a contract address
        if (session.contractAddress) {
          toast.success("Session is already deployed at " + session.contractAddress, { id: toastId });
          
          // Update session lifecycle if needed to ensure status is "started"
          const hasStartTime = session.sessionLifecycle && session.sessionLifecycle.startedAt;
          if (!hasStartTime) {
            await updateSessionStartTime(session._id);
          }
          return;
        }
        
        // Deploy the session to the blockchain
        toast.loading("Please confirm the transaction in MetaMask...", { id: toastId });
        const blockchainService = (await import('@/services/blockchain-service')).default;
        
        // This will trigger the MetaMask popup
        await blockchainService.createSession(session._id);
        
        // Update the session lifecycle - mark it as started now
        await updateSessionStartTime(session._id);
        
        // Refresh session data
        toast.loading("Updating session status...", { id: toastId });
        await fetchRefreshedSessionData();
        
        // Show success message
        toast.success("Session successfully deployed to blockchain", { id: toastId });
      } catch (blockchainError: any) {
        // If the blockchain deployment fails, handle appropriately
        console.error("Blockchain deployment error:", blockchainError);
        
        // Check for specific error types
        if (blockchainError.code === 4001) {
          toast.error("Transaction was rejected in MetaMask", { id: toastId });
        } else if (blockchainError.message?.includes("token not valid")) {
          toast.error("Authentication error - please refresh the page and try again", { id: toastId });
        } else {
          toast.error(blockchainError.message || "Failed to deploy session to blockchain", { id: toastId });
        }
      }
    } catch (err: any) {
      console.error("Session start error:", err);
      toast.error(err.message || "Failed to start session", { id: toastId });
    }
  }

  // Helper function to update session start time
  const updateSessionStartTime = async (sessionId: string) => {
    try {
      // Update the session lifecycle to mark it as started now if it hasn't been started yet
      const now = new Date().toISOString();
      await sessionService.updateSession(sessionId, {
        sessionLifecycle: {
          ...(session?.sessionLifecycle || {}),
          startedAt: now
        }
      });
      console.log("Updated session start time to:", now);
    } catch (error) {
      console.error("Failed to update session start time:", error);
    }
  }

  // Helper function to get fresh session data
  const fetchRefreshedSessionData = async () => {
    if (!session || !session._id) {
      console.error("Cannot refresh session data: no session ID");
      return null;
    }
    
    try {
      // Fetch the latest session data with a short delay to ensure DB updates are reflected
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store the ID in a local variable to avoid any potential issues with undefined
      const sessionId = String(session._id);
      const updatedSession = await sessionService.getSessionById(sessionId);
      
      if (updatedSession) {
        setSession(updatedSession);
      }
      
      return updatedSession;
    } catch (error) {
      console.error("Failed to refresh session data:", error);
      return null;
    }
  }

  const handleEndSession = async () => {
    // Use a unique ID for the toast to allow updates
    const toastId = "end-session-" + (session?._id || Date.now());
    
    try {
      if (!session || !session._id) return;
      
      // Initialize the loading state
      toast.loading("Ending session...", { id: toastId });
      
      // Check if this is a blockchain session
      if (session.contractAddress) {
        // Load blockchain service
        const blockchainService = (await import('@/services/blockchain-service')).default;
        
        try {
          // End the session by recording final blockchain data and updating database
          await blockchainService.endSession(session._id, session.contractAddress);
          
          // Successfully ended the session
          toast.success("Session ended and final blockchain data recorded", { id: toastId });
        } catch (blockchainError: any) {
          // If ending fails, show error but still attempt to update database
          console.error("End session error:", blockchainError);
          
          // For errors, show warning but continue with database update
          toast.warning(
            `Warning: ${blockchainError.message || "Failed to end session properly"}. 
            Will still update database status.`, 
            { id: toastId, duration: 5000 }
          );
          
          // Update the session in the database as a fallback
          const now = new Date().toISOString();
          await sessionService.updateSession(session._id, {
            sessionLifecycle: {
              ...(session.sessionLifecycle || {}),
              endedAt: now
            }
          });
        }
      } else {
        // Non-blockchain session, just update the database
        const now = new Date().toISOString();
        await sessionService.updateSession(session._id, {
          sessionLifecycle: {
            ...(session.sessionLifecycle || {}),
            endedAt: now
          }
        });
        
        toast.success("Session ended successfully", { id: toastId });
      }
      
      // Refresh session data
      await fetchRefreshedSessionData();
      
    } catch (err: any) {
      console.error("Session end error:", err);
      toast.error(err.message || "Failed to end session", { id: toastId });
    }
  }

  const handleDeleteSession = async () => {
    try {
      if (!session || !session._id) return
      
      if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
        await sessionService.deleteSession(session._id)
        toast.success("Session deleted successfully")
        // Redirect logic would go here
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session")
    }
  }

  const handleEditSession = () => {
    const status = getSessionStatus();
    if (status.status === "started" || status.status === "ended") {
      // If session is active or ended, only allow editing settings
      setEditSection('settings')
    } else {
      // Otherwise allow editing all details
      setEditSection('details')
    }
    setIsEditing(true)
    
    // Scroll to the appropriate section
    setTimeout(() => {
      const element = document.getElementById(editSection === 'settings' ? 'settings-tab' : 'details-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleSaveEdit = async () => {
    try {
      if (!session || !session._id) return
      
      // Gather form data based on which section is being edited
      const updateData: Partial<Session> = {};
      const status = getSessionStatus();
      
      if (editSection === 'details') {
        // Get values from detail form fields
        const nameInput = document.getElementById('session-name') as HTMLInputElement;
        const descriptionInput = document.getElementById('session-description') as HTMLTextAreaElement;
        const orgNameInput = document.getElementById('organization-name') as HTMLInputElement;
        
        if (nameInput && nameInput.value) updateData.name = nameInput.value;
        if (descriptionInput) updateData.description = descriptionInput.value;
        if (orgNameInput) updateData.organizationName = orgNameInput.value;
        
        // Check for session lifecycle fields (only if session hasn't started)
        if (status.status === "upcoming" || status.status === "nomination") {
          const sessionLifecycle: any = {
            ...session.sessionLifecycle
          };
          
          // Handle nomination dates (for election type)
          if (session.type === "election") {
            const nominationStartInput = document.getElementById('nomination-start') as HTMLInputElement;
            const nominationEndInput = document.getElementById('nomination-end') as HTMLInputElement;
            
            if (!sessionLifecycle.scheduledAt) sessionLifecycle.scheduledAt = {};
            
            if (nominationStartInput && nominationStartInput.value) {
              sessionLifecycle.scheduledAt.start = nominationStartInput.value;
            }
            
            if (nominationEndInput && nominationEndInput.value) {
              sessionLifecycle.scheduledAt.end = nominationEndInput.value;
            }
          }
          
          // Handle session start/end dates
          const sessionStartInput = document.getElementById('session-start') as HTMLInputElement;
          const sessionEndInput = document.getElementById('session-end') as HTMLInputElement;
          
          if (sessionStartInput) {
            sessionLifecycle.startedAt = sessionStartInput.value || null;
          }
          
          if (sessionEndInput) {
            sessionLifecycle.endedAt = sessionEndInput.value || null;
          }
          
          updateData.sessionLifecycle = sessionLifecycle;
        }
      } 
      else if (editSection === 'settings') {
        // Get values from settings form fields
        const verificationMethodInput = document.getElementById('verification-method') as HTMLSelectElement;
        const resultVisibilityInput = document.getElementById('result-visibility') as HTMLSelectElement;
        const secretPhraseInput = document.getElementById('secret-phrase') as HTMLInputElement;
        
        if (verificationMethodInput) 
          updateData.verificationMethod = verificationMethodInput.value as 'kyc' | 'standard' | null;
        if (resultVisibilityInput) 
          updateData.resultVisibility = resultVisibilityInput.value as 'real-time' | 'post-completion';
        if (secretPhraseInput) 
          updateData.secretPhrase = secretPhraseInput.value || null;
      }
      
      // Make the API call to update the session
      console.log('Sending update data:', updateData);
      const result = await sessionService.updateSession(session._id, updateData);
      
      if (result.needsApproval) {
        toast.success("Edit request submitted for approval");
      } else {
        toast.success("Session updated successfully");
      }
      
      setIsEditing(false);
      setEditSection(null);
      
      // Refresh session data
      const updatedSession = await sessionService.getSessionById(session._id);
      setSession(updatedSession);
    } catch (err: any) {
      console.error('Error updating session:', err);
      toast.error(err.message || "Failed to update session");
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditSection(null)
    toast.info("Edit cancelled")
  }

  // Convert candidates to the format expected by CandidateTable
  const mapCandidatesToTableFormat = (candidates: Candidate[] = []): NominationCandidate[] => {
    return candidates.map(candidate => ({
      id: candidate._id || candidate.id || "",
      fullName: candidate.fullName,
      email: candidate.user ? "User ID: " + candidate.user : "Unknown",
      dateOfBirth: candidate.dobPob?.dateOfBirth || "N/A",
      placeOfBirth: candidate.dobPob?.placeOfBirth || "N/A",
      nationalities: candidate.nationalities || [],
      experience: candidate.experience || "",
      biography: candidate.biography || "",
      promises: candidate.promises || [],
      status: "approved", // Default status for candidates in the session
      attachments: candidate.paper 
        ? [{ name: "Official Paper", size: "Unknown", url: candidate.paper }] 
        : []
    }))
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]">Loading session data...</div>
  }

  if (error || !session) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Failed to load session data"}</AlertDescription>
      </Alert>
    )
  }

  const statusInfo = getSessionStatus()

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden rounded-lg">
        <Image
          src={session.banner || "/placeholder.svg"}
          alt={session.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
      </div>

      {/* Session Details */}
      <div id="details-section" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {session.type}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {session.subtype}
          </Badge>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          <Badge variant={session.secretPhrase ? "outline" : "secondary"}>
            {getSessionVisibility()}
          </Badge>
        </div>

        {isEditing && editSection === 'details' ? (
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="text-lg font-medium">Edit Session Details</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="session-name" className="text-sm font-medium">
                  Session Name
                </label>
                <input 
                  id="session-name"
                  type="text" 
                  className="border rounded-md px-3 py-2" 
                  defaultValue={session.name} 
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="session-description" className="text-sm font-medium">
                  Description
                </label>
                <textarea 
                  id="session-description"
                  className="border rounded-md px-3 py-2" 
                  rows={3}
                  defaultValue={session.description || ""} 
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="organization-name" className="text-sm font-medium">
                  Organization Name
                </label>
                <input 
                  id="organization-name"
                  type="text" 
                  className="border rounded-md px-3 py-2" 
                  defaultValue={session.organizationName || ""} 
                />
              </div>
              
              {/* Session Lifecycle Dates - Only editable if not started */}
              {(statusInfo.status === "upcoming" || statusInfo.status === "nomination") && (
                <>
                  <h4 className="text-md font-medium pt-2">Session Timeline</h4>
                  
                  {session.type === "election" && (
                    <>
                      <div className="grid gap-2">
                        <label htmlFor="nomination-start" className="text-sm font-medium">
                          Nomination Start Time
                        </label>
                        <input 
                          id="nomination-start"
                          type="datetime-local" 
                          className="border rounded-md px-3 py-2" 
                          defaultValue={session.sessionLifecycle?.scheduledAt?.start ? 
                            new Date(session.sessionLifecycle.scheduledAt.start).toISOString().slice(0, 16) : 
                            ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="nomination-end" className="text-sm font-medium">
                          Nomination End Time
                        </label>
                        <input 
                          id="nomination-end"
                          type="datetime-local" 
                          className="border rounded-md px-3 py-2" 
                          defaultValue={session.sessionLifecycle?.scheduledAt?.end ? 
                            new Date(session.sessionLifecycle.scheduledAt.end).toISOString().slice(0, 16) : 
                            ""}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="grid gap-2">
                    <label htmlFor="session-start" className="text-sm font-medium">
                      Voting Start Time (Leave empty to start manually)
                    </label>
                    <input 
                      id="session-start"
                      type="datetime-local" 
                      className="border rounded-md px-3 py-2" 
                      defaultValue={session.sessionLifecycle?.startedAt ? 
                        new Date(session.sessionLifecycle.startedAt).toISOString().slice(0, 16) : 
                        ""}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="session-end" className="text-sm font-medium">
                      Voting End Time (Leave empty to end manually)
                    </label>
                    <input 
                      id="session-end"
                      type="datetime-local" 
                      className="border rounded-md px-3 py-2" 
                      defaultValue={session.sessionLifecycle?.endedAt ? 
                        new Date(session.sessionLifecycle.endedAt).toISOString().slice(0, 16) : 
                        ""}
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSaveEdit}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold">{session.name}</h1>
            {session.description && <p className="text-muted-foreground">{session.description}</p>}
            
            {session.organizationName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{session.organizationName}</span>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 mt-2">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Session Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created: {formatDate(session.sessionLifecycle?.createdAt)}</span>
              </div>
              
              {session.sessionLifecycle?.startedAt && (
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Started: {formatDate(session.sessionLifecycle.startedAt)}</span>
                </div>
              )}
              
              {session.sessionLifecycle?.endedAt && (
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ended: {formatDate(session.sessionLifecycle.endedAt)}</span>
                </div>
              )}
            </div>
          </Card>
          
          {session.type === "election" && session.sessionLifecycle?.scheduledAt?.start && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Nomination Phase</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Starts: {formatDate(session.sessionLifecycle.scheduledAt.start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ends: {formatDate(session.sessionLifecycle.scheduledAt.end)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {session.contractAddress && (
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Deployed at address: {session.contractAddress}</span>
          </div>
        )}
        {!session.contractAddress && statusInfo.status !== "upcoming" && (
          <div className="text-sm text-amber-500">Not deployed yet</div>
        )}

        {/* Blockchain information */}
        {session.contractAddress && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Blockchain Details</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract Address:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{session.contractAddress.substring(0, 10)}...{session.contractAddress.substring(session.contractAddress.length - 8)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => window.open(`https://sepolia.etherscan.io/address/${session.contractAddress}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {session.results?.lastBlockchainSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Blockchain Sync:</span>
                  <span className="text-sm">{new Date(session.results.lastBlockchainSync).toLocaleString()}</span>
                </div>
              )}
              
              {typeof session.results?.blockchainVoterCount === 'number' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Blockchain Voter Count:</span>
                  <span className="text-sm">{session.results.blockchainVoterCount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Tabs for different sections */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="settings" id="settings-tab" className="flex-1">Settings</TabsTrigger>
          <TabsTrigger value="data" className="flex-1">Vote Data</TabsTrigger>
          {session.type === "election" && session.candidateRequests && session.candidateRequests.length > 0 && (
            <TabsTrigger value="nominations" className="flex-1">Candidate Requests</TabsTrigger>
          )}
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {isEditing && editSection === 'settings' ? (
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-lg font-medium">Edit Session Settings</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="verification-method" className="text-sm font-medium">
                    Verification Method
                  </label>
                  <select 
                    id="verification-method"
                    className="border rounded-md px-3 py-2" 
                    defaultValue={session.verificationMethod || "standard"}
                  >
                    <option value="kyc">KYC</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="result-visibility" className="text-sm font-medium">
                    Result Visibility
                  </label>
                  <select 
                    id="result-visibility"
                    className="border rounded-md px-3 py-2" 
                    defaultValue={session.resultVisibility || "post-completion"}
                  >
                    <option value="real-time">Real-time</option>
                    <option value="post-completion">Post-completion</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="secret-phrase" className="text-sm font-medium">
                    Secret Phrase (Leave empty for public session)
                  </label>
                  <input 
                    id="secret-phrase"
                    type="text" 
                    className="border rounded-md px-3 py-2" 
                    defaultValue={session.secretPhrase || ""} 
                    placeholder="Enter a secret phrase to make this session private"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verification Method Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Verification Method</CardTitle>
                  <CardDescription>How users are verified before voting</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="capitalize">
                    {session.verificationMethod || "Standard"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Result Visibility Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Result Visibility</CardTitle>
                  <CardDescription>When vote results are visible to participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="capitalize">
                    {session.resultVisibility || "Post-completion"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Session Visibility Card - determine based on secret phrase */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Session Visibility</CardTitle>
                  <CardDescription>How the session is discovered by users</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="capitalize">
                    {getSessionVisibility()}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Vote Data Tab */}
        <TabsContent value="data" className="space-y-6">
          {session.type === "poll" && (
            <Card>
              <CardHeader>
                <CardTitle>Poll Options</CardTitle>
                <CardDescription>Vote counts for each option</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Vote Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(session as Poll).options.map((option: PollOption) => (
                      <TableRow key={option._id || option.name}>
                        <TableCell className="font-medium">{option.name}</TableCell>
                        <TableCell>{option.description || "N/A"}</TableCell>
                        <TableCell className="text-right">{option.totalVotes || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {session.type === "election" && (
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>Vote counts for each candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead className="text-right">Vote Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(session as Election).candidates?.map((candidate: Candidate) => (
                      <TableRow key={candidate._id || candidate.user}>
                        <TableCell className="font-medium">{candidate.fullName}</TableCell>
                        <TableCell>{candidate.partyName}</TableCell>
                        <TableCell className="text-right">{candidate.totalVotes || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fix: Only show nominations tab for elections, not polls */}
        {session.type === "election" && session.candidateRequests && session.candidateRequests.length > 0 && (
          <TabsContent value="nominations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Requests</CardTitle>
                <CardDescription>Candidates who have applied to be part of this election</CardDescription>
              </CardHeader>
              <CardContent>
                <CandidateTable 
                  candidates={mapCandidatesToTableFormat(session.candidateRequests as unknown as Candidate[] || [])}
                  onAccept={(id) => {
                    toast.success(`Approved candidate ${id}`)
                    // Implement accept logic here
                  }}
                  onReject={(id) => {
                    toast.error(`Rejected candidate ${id}`)
                    // Implement reject logic here
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Separator className="my-6" />

      {/* Actions Section - Always visible at the bottom */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Start Session Button */}
          {(statusInfo.status === "upcoming" || statusInfo.status === "nomination" || statusInfo.status === "pending_deployment") && (
            <Button 
              onClick={handleStartSession} 
              size="lg"
              className={`w-full ${
                statusInfo.status === "pending_deployment" 
                ? "bg-amber-600 hover:bg-amber-700" 
                : "bg-green-600 hover:bg-green-700"
              } text-white flex items-center justify-center gap-2`}
            >
              <Vote className="h-5 w-5" />
              <span>
                {statusInfo.status === "pending_deployment" 
                  ? "Deploy Contract" 
                  : "Start Session"}
              </span>
            </Button>
          )}

          {/* End Session Button */}
          {statusInfo.status === "started" && !session.sessionLifecycle?.endedAt && (
            <Button 
              onClick={handleEndSession} 
              size="lg"
              variant="secondary" 
              className="w-full flex items-center justify-center gap-2"
            >
              <BarChart className="h-5 w-5" />
              <span>End Session</span>
            </Button>
          )}

          {/* Edit Session Button */}
          <Button 
            onClick={handleEditSession} 
            variant={isEditing ? "default" : "outline"} 
            size="lg"
            className={`w-full flex items-center justify-center gap-2 ${isEditing ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
            disabled={statusInfo.status === "ended"}
          >
            <ExternalLink className="h-5 w-5" />
            <span>{isEditing ? "Currently Editing" : "Edit Session"}</span>
          </Button>

          {/* Delete Session Button */}
          <Button 
            onClick={handleDeleteSession} 
            variant="destructive" 
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            <XCircle className="h-5 w-5" />
            <span>Delete Session</span>
          </Button>
        </div>
      </div>

      {session.contractAddress && session._id && (
        <BlockchainSync sessionId={session._id} />
      )}
    </div>
  )
} 