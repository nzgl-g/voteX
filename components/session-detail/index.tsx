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
import { Candidate as NominationCandidate, CandidateStatus } from "@/components/nomination-requests/data"
import sessionService, { Session, Election, Poll, Candidate, PollOption } from "@/services/session-service"
import candidateService from "@/services/candidate-service"
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
  const [candidateRequests, setCandidateRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)
        const data = await sessionService.getSessionById(sessionId)
        setSession(data)
        setError(null)

        // Only attempt to get blockchain data if session is deployed or active
        const status = getSessionStatusFromData(data);
        if (status !== "upcoming" && status !== "nomination") {
          try {
            const voteMetadata = await sessionService.getVoteMetadata(sessionId)
            console.log('Vote Metadata loaded:', voteMetadata)
            
            // Also log blockchain deployment data for reference
            const blockchainData = await sessionService.getBlockchainDeploymentData(sessionId)
            console.log('Blockchain Deployment Data:', blockchainData)
          } catch (metadataErr) {
            console.error('Failed to load vote metadata:', metadataErr)
          }
        }
        
        // If this is an election, also load candidate requests
        if (data.type === 'election') {
          loadCandidateRequests();
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

  // Helper function to get session status from session data
  const getSessionStatusFromData = (session: Session | null): string => {
    if (!session || !session.sessionLifecycle) {
      return "unknown";
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
      return "ended";
    }

    // Check if session has ended based on scheduled end time
    if (endedAt && now > endedAt) {
      return "ended";
    }

    // Check if session has a contract address (indicates it's deployed)
    if (session.contractAddress) {
      return "started";
    }

    // Check if session has started by startedAt field
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return "pending_deployment";
    }

    // Check for nomination phase (for election type)
    if (session.type === "election" && scheduledStart && scheduledEnd) {
      if (now >= scheduledStart && now <= scheduledEnd) {
        return "nomination";
      }
    }

    // Default to coming soon
    return "upcoming";
  }

  const getSessionStatus = (): { status: string; label: string; color: string } => {
    const status = getSessionStatusFromData(session);
    
    switch (status) {
      case "ended":
        return {
          status: "ended",
          label: "Ended",
          color: "bg-zinc-800 text-zinc-200",
        };
      case "started":
        return {
          status: "started",
          label: "Active",
          color: "bg-emerald-600 text-white",
        };
      case "pending_deployment":
        return {
          status: "pending_deployment",
          label: "Pending Deployment",
          color: "bg-amber-500 text-black dark:text-zinc-900",
        };
      case "nomination":
        return {
          status: "nomination",
          label: "Nominations",
          color: "bg-amber-500 text-black dark:text-zinc-900",
        };
      case "upcoming":
        return {
          status: "upcoming",
          label: "Coming Soon",
          color: "bg-blue-500 text-white",
        };
      default:
        return {
          status: "unknown",
          label: "Unknown",
          color: "bg-muted text-muted-foreground",
        };
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
  const mapCandidatesToTableFormat = (candidates: any[] = []): NominationCandidate[] => {
    console.log("Mapping candidates to table format, count:", candidates?.length || 0);
    
    // If candidates is not an array, log and return empty array
    if (!Array.isArray(candidates)) {
      console.error("candidateRequests is not an array:", candidates);
      return [];
    }
    
    // Generate unique IDs for any items missing them
    let uniqueIdCounter = 1;
    
    const mappedCandidates = candidates.map(candidate => {
      // Ensure we have a valid ID for each candidate (critical for React keys)
      const candidateId = candidate._id || candidate.id || `temp-id-${uniqueIdCounter++}`;
      
      // Make sure to provide valid values for required fields (especially email)
      // The email can come from the user object or directly from candidate
      let email = candidate.email || "No email";
      
      if (!candidate.email && candidate.user) {
        if (typeof candidate.user === 'object') {
          // If user is an object with email
          if (candidate.user.email) {
            email = candidate.user.email;
          } else if (candidate.user._id) {
            email = `User ID: ${candidate.user._id}`;
          }
        } else {
          // If user is just a string ID
          email = `User ID: ${String(candidate.user)}`;
        }
      }

      // Format date of birth if it exists
      let dateOfBirth = "N/A";
      if (candidate.dobPob && candidate.dobPob.dateOfBirth) {
        // Handle MongoDB date format ($date)
        if (typeof candidate.dobPob.dateOfBirth === 'object' && candidate.dobPob.dateOfBirth.$date) {
          dateOfBirth = new Date(candidate.dobPob.dateOfBirth.$date).toISOString().split('T')[0];
        } else {
          // Regular date string
          try {
            dateOfBirth = new Date(candidate.dobPob.dateOfBirth).toISOString().split('T')[0];
          } catch (e) {
            dateOfBirth = String(candidate.dobPob.dateOfBirth) || "N/A";
          }
        }
      }

      // Ensure arrays are actually arrays
      const nationalities = Array.isArray(candidate.nationalities) ? 
                          candidate.nationalities : 
                          (candidate.nationalities ? [String(candidate.nationalities)] : []);
                          
      const promises = Array.isArray(candidate.promises) ? 
                     candidate.promises : 
                     (candidate.promises ? [String(candidate.promises)] : []);

      return {
        id: candidateId,
        fullName: candidate.fullName || "Unknown",
        email: email,
        dateOfBirth: dateOfBirth,
        placeOfBirth: candidate.dobPob?.placeOfBirth || "N/A",
        nationalities: nationalities,
        experience: candidate.experience || "",
        biography: candidate.biography || "",
        promises: promises,
        status: (candidate.status as CandidateStatus) || "pending",
        attachments: candidate.paper 
          ? [{ name: "Official Paper", size: "Unknown", url: candidate.paper }] 
          : []
      };
    });
    
    // Remove any duplicate candidates (based on id)
    const uniqueCandidates = mappedCandidates.filter((candidate, index, self) => 
      candidate.id && index === self.findIndex(c => c.id === candidate.id)
    );
    
    return uniqueCandidates;
  }

  // Handle accepting a candidate request
  const handleAcceptCandidate = async (id: string) => {
    if (!session || !session._id) return;
    
    try {
      // Show loading toast
      toast.loading(`Processing candidate request...`);
      
      // Call the API to accept the candidate request
      const result = await candidateService.acceptCandidateRequest(session._id, id);
      
      // Show success toast
      toast.success(result.message || "Candidate request accepted");
      
      // Refresh data
      await Promise.all([
        fetchRefreshedSessionData(),  // Refresh session data
        loadCandidateRequests()       // Reload candidate requests
      ]);
    } catch (error: any) {
      console.error("Error accepting candidate:", error);
      toast.error(error.message || "Failed to accept candidate request");
    }
  }
  
  // Handle rejecting a candidate request
  const handleRejectCandidate = async (id: string) => {
    if (!session || !session._id) return;
    
    try {
      // Show loading toast
      toast.loading(`Processing candidate request...`);
      
      // Call the API to reject the candidate request
      const result = await candidateService.rejectCandidateRequest(session._id, id);
      
      // Show success toast
      toast.success(result.message || "Candidate request rejected");
      
      // Refresh data
      await Promise.all([
        fetchRefreshedSessionData(),  // Refresh session data
        loadCandidateRequests()       // Reload candidate requests
      ]);
    } catch (error: any) {
      console.error("Error rejecting candidate:", error);
      toast.error(error.message || "Failed to reject candidate request");
    }
  }

  // Debug helper for candidate requests
  const debugCandidateRequests = () => {
    if (!session) return null;
    
    const debug = {
      hasRequests: !!session.candidateRequests,
      requestsLength: session.candidateRequests ? session.candidateRequests.length : 0,
      isArray: Array.isArray(session.candidateRequests),
      type: typeof session.candidateRequests,
      requestsContent: session.candidateRequests,
    };
    
    console.log("DEBUG CANDIDATE REQUESTS:", debug);
    
    // Also check for the _id field in each request
    if (Array.isArray(session.candidateRequests)) {
      session.candidateRequests.forEach((req, index) => {
        console.log(`Request #${index} ID:`, req._id || "MISSING ID", "Type:", typeof req);
      });
    }
    
    return (
      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto max-h-40 my-2">
        <pre>{JSON.stringify(debug, null, 2)}</pre>
      </div>
    );
  };

  // Function to load candidate requests directly
  const loadCandidateRequests = async () => {
    if (!sessionId) return;
    
    try {
      setLoadingRequests(true);
      console.log("Directly fetching candidate requests for session:", sessionId);
      
      const requests = await candidateService.getCandidateRequests(sessionId);
      console.log("Directly received candidate requests:", requests);
      
      setCandidateRequests(requests);
    } catch (error) {
      console.error("Error loading candidate requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };
  
  // Load candidate requests when the nominations tab is selected
  const handleTabChange = (value: string) => {
    if (value === 'nominations' && session && session.type === 'election') {
      loadCandidateRequests();
    }
  };

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
      {/* Banner with overlaid elements - Completely redesigned */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl shadow-lg">
        <Image
          src={session.banner || "/placeholder.svg"}
          alt={session.name}
          fill
          className="object-cover"
          priority
        />
        {/* Stronger gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
        
        {/* Session Tags - Now at the top of the content area, above session name */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="capitalize bg-indigo-500/80 dark:bg-indigo-600/80 backdrop-blur-md text-white border-transparent">
            {session.type}
          </Badge>
          <Badge variant="outline" className="capitalize bg-violet-500/80 dark:bg-violet-600/80 backdrop-blur-md text-white border-transparent">
            {session.subtype}
          </Badge>
          <Badge className={`backdrop-blur-md border-transparent ${statusInfo.status === "started" ? "bg-emerald-500/80 dark:bg-emerald-600/80" : 
                            statusInfo.status === "ended" ? "bg-zinc-500/80 dark:bg-zinc-600/80" : 
                            statusInfo.status === "nomination" || statusInfo.status === "pending_deployment" ? "bg-amber-500/80 dark:bg-amber-600/80" : 
                            "bg-blue-500/80 dark:bg-blue-600/80"} text-white`}>
            {statusInfo.label}
          </Badge>
          <Badge variant={session.secretPhrase ? "outline" : "secondary"} 
                 className={`backdrop-blur-md border-transparent ${session.secretPhrase ? "bg-slate-500/80 dark:bg-slate-600/80 text-white" : "bg-teal-500/80 dark:bg-teal-600/80 text-white"}`}>
            {getSessionVisibility()}
          </Badge>
        </div>
        
        {/* Session name and description - Below the badges */}
        <div className="absolute top-16 left-4 flex flex-col items-start justify-start text-left px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{session.name}</h1>
          {session.description && (
            <p className="text-white/80 max-w-2xl mb-4">{session.description}</p>
          )}
        </div>
        
        {/* Organization name - Top left, adjusted position to be below description */}
        {session.organizationName && (
          <div className="absolute top-36 left-4 flex items-center gap-2 text-white/90">
            <Users className="h-4 w-4" />
            <span className="font-medium">{session.organizationName}</span>
          </div>
        )}
        
        {/* Action Buttons - Bottom right corner */}
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-3 justify-end">
          {/* Start Session Button */}
          {(statusInfo.status === "upcoming" || statusInfo.status === "nomination" || statusInfo.status === "pending_deployment") && (
            <Button 
              onClick={handleStartSession} 
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md hover:shadow-lg rounded-lg transition-all duration-300 px-4 border border-emerald-400/20 flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {statusInfo.status === "pending_deployment" ? "Deploy Contract" : "Start Session"}
            </Button>
          )}

          {/* End Session Button */}
          {statusInfo.status === "started" && !session.sessionLifecycle?.endedAt && (
            <Button 
              onClick={handleEndSession} 
              variant="secondary"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-medium shadow-md hover:shadow-lg rounded-lg transition-all duration-300 px-4 border border-violet-400/20 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              End Session
            </Button>
          )}

          {/* Edit Session Button */}
          <Button 
            onClick={handleEditSession} 
            variant={isEditing ? "default" : "outline"}
            size="sm"
            className={`${isEditing ? "bg-gradient-to-r from-blue-500 to-cyan-600" : "bg-gradient-to-r from-sky-500 to-blue-600"} hover:from-sky-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg rounded-lg transition-all duration-300 px-4 border border-blue-400/20 flex items-center gap-2`}
            disabled={statusInfo.status === "ended"}
          >
            <UserPlus className="h-4 w-4" />
            {isEditing ? "Currently Editing" : "Edit Session"}
          </Button>

          {/* Delete Session Button */}
          <Button 
            onClick={handleDeleteSession} 
            variant="destructive"
            size="sm"
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium shadow-md hover:shadow-lg rounded-lg transition-all duration-300 px-4 border border-red-400/20 flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Delete Session
          </Button>
        </div>
      </div>

      {/* Session Details */}
      <div id="details-section" className="space-y-4">

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
            {/* Session name, description, and organization info moved to banner overlay */}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 mt-2">
          <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-muted/20 transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Session Timeline</h3>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-muted/30 to-muted-foreground/20 z-0"></div>
                
                <div className="relative z-10 space-y-6 pl-8">
                  <div className="relative">
                    <div className="absolute -left-8 top-0 bg-muted/40 backdrop-blur-sm rounded-full p-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Created</p>
                      <p className="text-foreground">{formatDate(session.sessionLifecycle?.createdAt)}</p>
                    </div>
                  </div>
                  
                  {session.sessionLifecycle?.startedAt && (
                    <div className="relative">
                      <div className="absolute -left-8 top-0 bg-muted/40 backdrop-blur-sm rounded-full p-1.5">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Started</p>
                        <p className="text-foreground">{formatDate(session.sessionLifecycle.startedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {session.sessionLifecycle?.endedAt && (
                    <div className="relative">
                      <div className="absolute -left-8 top-0 bg-muted/40 backdrop-blur-sm rounded-full p-1.5">
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Ended</p>
                        <p className="text-foreground">{formatDate(session.sessionLifecycle.endedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {session.type === "election" && session.sessionLifecycle?.scheduledAt?.start && (
            <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-muted/20 transition-all duration-300">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Nomination Phase</h3>
                  <div className="bg-muted/50 p-2 rounded-full">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-5">
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border-l-2 border-border/50">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Starts</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">{formatDate(session.sessionLifecycle.scheduledAt.start)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border-l-2 border-border/50">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Ends</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">{formatDate(session.sessionLifecycle.scheduledAt.end)}</p>
                    </div>
                  </div>
                  
                  {getSessionStatusFromData(session) === "nomination" && (
                    <div className="mt-4 text-center">
                      <Badge className="bg-muted/70 hover:bg-muted/90 text-foreground px-3 py-1 text-sm">
                        Nominations Active
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Blockchain information - Redesigned into a single cohesive block */}
        {session.contractAddress ? (
          <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-muted/20 transition-all duration-300 mt-4">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Blockchain Details</h3>
                <div className="bg-muted/50 p-2 rounded-full">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border-l-2 border-border/50">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Contract Address</p>
                  <div className="flex items-center justify-between">
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
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border-l-2 border-border/50">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Last Blockchain Sync</p>
                    <span className="text-sm">{new Date(session.results.lastBlockchainSync).toLocaleString()}</span>
                  </div>
                )}
                
                {typeof session.results?.blockchainVoterCount === 'number' && (
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-4 border-l-2 border-border/50">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Blockchain Voter Count</p>
                    <span className="text-sm">{session.results.blockchainVoterCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : statusInfo.status !== "upcoming" && (
          <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-muted/20 transition-all duration-300 mt-4">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Blockchain Details</h3>
                <div className="bg-muted/50 p-2 rounded-full">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-4 border-l-2 border-amber-500/50">
                <p className="text-amber-500">Not deployed yet</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Tabs for different sections */}
      <Tabs defaultValue="settings" className="w-full" onValueChange={handleTabChange}>
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
            <div className="space-y-8">
              <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center">
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Session Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Verification Method */}
                    <div className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm rounded-xl p-5 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-medium text-foreground">Verification Method</h4>
                        <div className="bg-muted/50 p-2 rounded-full">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">How users are verified before voting</p>
                      <div className="mt-auto">
                        <Badge 
                          variant={session.verificationMethod === "kyc" ? "default" : "secondary"} 
                          className={`capitalize px-3 py-1 ${
                            session.verificationMethod === "kyc" 
                              ? "bg-emerald-500/90 hover:bg-emerald-600/90 text-white" 
                              : "bg-blue-500/90 hover:bg-blue-600/90 text-white"
                          }`}
                        >
                          {session.verificationMethod || "Standard"}
                        </Badge>
                      </div>
                    </div>

                    {/* Result Visibility */}
                    <div className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm rounded-xl p-5 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-medium text-foreground">Result Visibility</h4>
                        <div className="bg-muted/50 p-2 rounded-full">
                          <BarChart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">When vote results are visible to participants</p>
                      <div className="mt-auto">
                        <Badge 
                          variant={session.resultVisibility === "real-time" ? "default" : "secondary"} 
                          className={`capitalize px-3 py-1 ${
                            session.resultVisibility === "real-time" 
                              ? "bg-violet-500/90 hover:bg-violet-600/90 text-white" 
                              : "bg-amber-500/90 hover:bg-amber-600/90 text-white"
                          }`}
                        >
                          {session.resultVisibility === "real-time" ? "Real-time" : "Post-completion"}
                        </Badge>
                      </div>
                    </div>

                    {/* Session Visibility */}
                    <div className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm rounded-xl p-5 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-medium text-foreground">Session Visibility</h4>
                        <div className="bg-muted/50 p-2 rounded-full">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">How the session is discovered by users</p>
                      <div className="mt-auto">
                        <Badge 
                          variant={session.secretPhrase ? "default" : "secondary"} 
                          className={`capitalize px-3 py-1 ${
                            session.secretPhrase 
                              ? "bg-slate-500/90 hover:bg-slate-600/90 text-white" 
                              : "bg-teal-500/90 hover:bg-teal-600/90 text-white"
                          }`}
                        >
                          {getSessionVisibility()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional information section */}
                  <div className="mt-8 bg-muted/20 backdrop-blur-sm rounded-xl p-5 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Session Security</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      This session uses {session.verificationMethod === "kyc" ? "KYC verification" : "standard verification"} and 
                      {session.secretPhrase ? " requires a secret phrase for access" : " is publicly accessible"}. 
                      Results are visible {session.resultVisibility === "real-time" ? "in real-time as votes are cast" : "only after the session has ended"}.
                    </p>
                  </div>
                </div>
              </div>
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
        {session.type === "election" && (
          <TabsContent value="nominations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Requests</CardTitle>
                <CardDescription>Candidates who have applied to be part of this election</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Loading state */}
                {loadingRequests ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading candidate requests...
                  </div>
                ) : candidateRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidate requests found for this session
                  </div>
                ) : (
                  <CandidateTable 
                    candidates={mapCandidatesToTableFormat(candidateRequests)}
                    onAccept={handleAcceptCandidate}
                    onReject={handleRejectCandidate}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Separator className="my-6" />

      {/* Actions section removed from here and moved to the top */}

      {session.contractAddress && session._id && (
        <BlockchainSync sessionId={session._id} />
      )}
    </div>
  )
} 