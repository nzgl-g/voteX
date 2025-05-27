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
import { cn } from "@/lib/utils"

// Timeline event component for the session timeline
interface TimelineEventProps { 
  title: string;
  date: string;
  isActive?: boolean;
  isPast?: boolean;
  isFuture?: boolean;
}

const TimelineEvent = ({ 
  title, 
  date, 
  isActive = false,
  isPast = false,
  isFuture = false
}: TimelineEventProps) => (
  <div className={cn(
    "relative flex items-start p-2 transition-all",
    isActive ? "border-l-2 border-primary pl-3" : 
    isPast ? "opacity-90 pl-3" :
    isFuture ? "opacity-70 pl-3" : "pl-3"
  )}>
    <div>
      <p className={cn(
        "text-sm font-medium",
        isActive ? "text-primary" : 
        isPast ? "text-foreground" :
        isFuture ? "text-muted-foreground" : "text-foreground"
      )}>
        {title}
      </p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
  </div>
);

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
  const [processingCandidates, setProcessingCandidates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        
        // Set a timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Session data request timed out")), 15000)
        );
        
        // Primary session data fetch with timeout
        const sessionPromise = sessionService.getSessionById(sessionId);
        const data = await Promise.race([sessionPromise, timeoutPromise]) as Session;
        
        setSession(data);
        setError(null);

        // Only attempt to get blockchain data if session is deployed or active
        const status = getSessionStatusFromData(data);
        if (status !== "upcoming" && status !== "nomination") {
          // Load blockchain data in a non-blocking way
          Promise.all([
            sessionService.getVoteMetadata(sessionId).catch(err => {
              console.error('Failed to load vote metadata:', err);
              return null;
            }),
            sessionService.getBlockchainDeploymentData(sessionId).catch(err => {
              console.error('Failed to load blockchain deployment data:', err);
              return null;
            })
          ]).then(([voteMetadata, blockchainData]) => {
            if (voteMetadata) console.log('Vote Metadata loaded:', voteMetadata);
            if (blockchainData) {
              console.log('Blockchain Deployment Data:', blockchainData);
              
              // Warn if no participants found but don't show an error
              if (blockchainData.participants.length === 0) {
                console.warn('No participants found for this session. Deployment to blockchain may not be possible.');
              }
            }
          });
        }
        
        // If this is an election, also load candidate requests (non-blocking)
        if (data.type === 'election') {
          // Don't wait for this to complete
          loadCandidateRequests().catch(err => {
            console.error('Failed to load candidate requests:', err);
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load session data");
        toast.error(err.message || "Failed to load session data");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSessionData();
    }
    
    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      // Any cleanup logic for aborted requests would go here
    };
  }, [sessionId]);

  // Helper function to get session status from session data - COMPLETELY REWRITTEN
  const getSessionStatusFromData = (session: Session | null): string => {
    if (!session || !session.sessionLifecycle) {
      return "unknown";
    }

    const now = new Date();
    
    // 1. If session is explicitly marked as ended, it's ended regardless of other factors
    if (session.sessionLifecycle.endedAt && new Date(session.sessionLifecycle.endedAt) <= now) {
      return "ended";
    }

    // 2. If session has a contract address and has started, it's active
    if (session.contractAddress && session.sessionLifecycle.startedAt && 
        new Date(session.sessionLifecycle.startedAt) <= now) {
      return "active";
    }
    
    // 3. If session has been marked as started (startedAt) but no contract address, it's pending deployment
    if (session.sessionLifecycle.startedAt && !session.contractAddress && 
        new Date(session.sessionLifecycle.startedAt) <= now) {
      return "pending_deployment";
    }

    // 4. For elections, check if we're in the nomination phase
    if (session.type === "election" && 
        session.sessionLifecycle.scheduledAt?.start && 
        session.sessionLifecycle.scheduledAt?.end) {
      
      const nominationStart = new Date(session.sessionLifecycle.scheduledAt.start);
      const nominationEnd = new Date(session.sessionLifecycle.scheduledAt.end);
      
      if (now >= nominationStart && now <= nominationEnd) {
        return "nomination";
      }
    }

    // 5. Check if we're in a scheduled start/end window for polls
    if (session.type === "poll" && 
        session.sessionLifecycle.scheduledAt?.start && 
        !session.sessionLifecycle.startedAt) {
      
      const scheduledStart = new Date(session.sessionLifecycle.scheduledAt.start);
      
      if (now >= scheduledStart) {
        return "ready_to_start";
      }
    }
    
    // 6. Default to upcoming
    return "upcoming";
  }

  const getSessionStatus = (): { status: string; label: string; color: string; icon: React.ReactNode } => {
    const status = getSessionStatusFromData(session);
    
    switch (status) {
      case "ended":
        return {
          status: "ended",
          label: "Ended",
          color: "bg-zinc-800 text-zinc-200",
          icon: <CheckCircle className="h-4 w-4" />
        };
      case "active":
        return {
          status: "active",
          label: "Active",
          color: "bg-emerald-600 text-white",
          icon: <Vote className="h-4 w-4" />
        };
      case "pending_deployment":
        return {
          status: "pending_deployment",
          label: "Pending Deployment",
          color: "bg-amber-500 text-black dark:text-zinc-900",
          icon: <Clock className="h-4 w-4" />
        };
      case "nomination":
        return {
          status: "nomination",
          label: "Nominations Open",
          color: "bg-amber-500 text-black dark:text-zinc-900",
          icon: <UserPlus className="h-4 w-4" />
        };
      case "ready_to_start":
        return {
          status: "ready_to_start",
          label: "Ready to Start",
          color: "bg-indigo-500 text-white",
          icon: <Clock className="h-4 w-4" />
        };
      case "upcoming":
        return {
          status: "upcoming",
          label: "Coming Soon",
          color: "bg-blue-500 text-white",
          icon: <Calendar className="h-4 w-4" />
        };
      default:
        return {
          status: "unknown",
          label: "Unknown",
          color: "bg-muted text-muted-foreground",
          icon: <Calendar className="h-4 w-4" />
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
        
        // Set up a timeout for the blockchain deployment
        const blockchainTimeoutMs = 30000; // 30 seconds
        let deploymentTimer: NodeJS.Timeout | null = null;
        
        // Create a promise that will reject after the timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          deploymentTimer = setTimeout(() => {
            reject(new Error("Blockchain deployment timed out"));
          }, blockchainTimeoutMs);
        });
        
        // Deploy the session to the blockchain
        toast.loading("Please confirm the transaction in MetaMask...", { id: toastId });
        const blockchainService = (await import('@/services/blockchain-service')).default;
        
        try {
          // This will trigger the MetaMask popup - race with timeout
          const deploymentPromise = blockchainService.createSession(session._id);
          await Promise.race([deploymentPromise, timeoutPromise]);
          
          // Clear the timeout if deployment succeeded
          if (deploymentTimer) clearTimeout(deploymentTimer);
          
          // Update the session lifecycle - mark it as started now
          await updateSessionStartTime(session._id);
          
          // Refresh session data
          toast.loading("Updating session status...", { id: toastId });
          await fetchRefreshedSessionData();
          
          // Show success message
          toast.success("Session successfully deployed to blockchain", { id: toastId });
        } catch (deployError: any) {
          // Clear the timeout if we got an error
          if (deploymentTimer) clearTimeout(deploymentTimer);
          
          // Re-throw to be handled by the outer catch
          throw deployError;
        }
      } catch (blockchainError: any) {
        // If the blockchain deployment fails, handle appropriately
        console.error("Blockchain deployment error:", blockchainError);
        
        // Check for specific error types
        if (blockchainError.code === 4001) {
          toast.error("Transaction was rejected in MetaMask", { id: toastId });
        } else if (blockchainError.message?.includes("token not valid")) {
          toast.error("Authentication error - please refresh the page and try again", { id: toastId });
        } else if (blockchainError.message?.includes("timed out")) {
          toast.error("Blockchain deployment timed out. Please try again", { id: toastId });
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
    // Remove the restriction for started/ended sessions - allow editing settings at all times
    if (status.status === "started" || status.status === "ended") {
      // For active/ended sessions, only allow editing settings, not basic details
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

  // New dedicated function to edit settings - works in all cases
  const handleEditSettings = () => {
    setEditSection('settings')
    setIsEditing(true)
    
    // Make sure the settings tab is active and scrolled into view
    const tabsList = document.querySelector('[role="tablist"]') as HTMLElement
    if (tabsList) {
      const settingsTab = Array.from(tabsList.children).find(
        tab => tab.getAttribute('data-value') === 'settings' || 
        tab.getAttribute('value') === 'settings'
      ) as HTMLElement
      
      if (settingsTab) {
        settingsTab.click()
      }
    }
    
    // Scroll to the settings section
    setTimeout(() => {
      const element = document.getElementById('settings-tab')
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
        // Check for banner edit fields first (they take precedence if present)
        const bannerNameInput = document.getElementById('banner-session-name') as HTMLInputElement;
        const bannerDescInput = document.getElementById('banner-session-description') as HTMLTextAreaElement;
        const bannerOrgInput = document.getElementById('banner-organization-name') as HTMLInputElement;
        
        // Fall back to regular form fields if banner fields don't exist
        const nameInput = document.getElementById('session-name') as HTMLInputElement;
        const descriptionInput = document.getElementById('session-description') as HTMLTextAreaElement;
        const orgNameInput = document.getElementById('organization-name') as HTMLInputElement;
        
        // Use banner values if available, otherwise use form values
        if (bannerNameInput && bannerNameInput.value) {
          updateData.name = bannerNameInput.value;
        } else if (nameInput && nameInput.value) {
          updateData.name = nameInput.value;
        }
        
        if (bannerDescInput) {
          updateData.description = bannerDescInput.value;
        } else if (descriptionInput) {
          updateData.description = descriptionInput.value;
        }
        
        if (bannerOrgInput) {
          updateData.organizationName = bannerOrgInput.value;
        } else if (orgNameInput) {
          updateData.organizationName = orgNameInput.value;
        }
        
        // Check for session lifecycle fields (only if session hasn't started)
        if (status.status === "upcoming" || status.status === "nomination") {
          const sessionLifecycle: any = {
            ...session.sessionLifecycle
          };
          
          // Handle nomination dates (for election type)
          if (session.type === "election") {
            const nominationStartInput = document.getElementById('nomination-start') as HTMLInputElement;
            const nominationEndInput = document.getElementById('nomination-end') as HTMLInputElement;
            
            // Ensure scheduledAt exists
            if (!sessionLifecycle.scheduledAt) sessionLifecycle.scheduledAt = {};
            
            // For elections, scheduledAt represents nomination period
            if (nominationStartInput && nominationStartInput.value) {
              sessionLifecycle.scheduledAt.start = nominationStartInput.value;
            }
            
            if (nominationEndInput && nominationEndInput.value) {
              sessionLifecycle.scheduledAt.end = nominationEndInput.value;
            }
          } else {
            // For polls, scheduledAt represents the voting period (same as startedAt/endedAt)
            const sessionStartInput = document.getElementById('session-start') as HTMLInputElement;
            const sessionEndInput = document.getElementById('session-end') as HTMLInputElement;
            
            // Ensure scheduledAt exists
            if (!sessionLifecycle.scheduledAt) sessionLifecycle.scheduledAt = {};
            
            if (sessionStartInput && sessionStartInput.value) {
              if (!sessionLifecycle.scheduledAt) sessionLifecycle.scheduledAt = {};
              sessionLifecycle.scheduledAt.start = sessionStartInput.value;
            }
            
            if (sessionEndInput && sessionEndInput.value) {
              sessionLifecycle.scheduledAt.end = sessionEndInput.value;
            }
          }
          
          // Handle session start/end dates - these always represent the voting period
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
  // Memoize candidates mapping to prevent unnecessary recalculations
  const mapCandidatesToTableFormat = (candidates: any[] = []): NominationCandidate[] => {
    // If candidates is not an array, return empty array
    if (!Array.isArray(candidates)) {
      console.error("candidateRequests is not an array:", candidates);
      return [];
    }
    
    // Generate unique IDs for any items missing them
    let uniqueIdCounter = 1;
    
    try {
      const mappedCandidates = candidates.map(candidate => {
        // Ensure we have a valid ID for each candidate (critical for React keys)
        const candidateId = candidate._id || candidate.id || `temp-id-${uniqueIdCounter++}`;
        
        // Get email from candidate or user object
        let email = candidate.email || "No email";
        if (!candidate.email && candidate.user) {
          if (typeof candidate.user === 'object' && candidate.user?.email) {
            email = candidate.user.email;
          } else if (typeof candidate.user === 'object' && candidate.user?._id) {
            email = `User ID: ${candidate.user._id}`;
          } else if (candidate.user) {
            email = `User ID: ${String(candidate.user)}`;
          }
        }

        // Format date of birth if it exists
        let dateOfBirth = "N/A";
        try {
          if (candidate.dobPob?.dateOfBirth) {
            if (typeof candidate.dobPob.dateOfBirth === 'object' && candidate.dobPob.dateOfBirth.$date) {
              dateOfBirth = new Date(candidate.dobPob.dateOfBirth.$date).toISOString().split('T')[0];
            } else {
              dateOfBirth = new Date(candidate.dobPob.dateOfBirth).toISOString().split('T')[0];
            }
          }
        } catch (e) {
          dateOfBirth = String(candidate.dobPob?.dateOfBirth) || "N/A";
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
      
      // More efficient way to remove duplicates using object lookup
      const seenIds = new Set<string>();
      const uniqueCandidates = mappedCandidates.filter(candidate => {
        if (!candidate.id || seenIds.has(candidate.id)) return false;
        seenIds.add(candidate.id);
        return true;
      });
      
      return uniqueCandidates;
    } catch (error) {
      console.error("Error mapping candidates:", error);
      return [];
    }
  }

  // Handle accepting a candidate request
  const handleAcceptCandidate = async (id: string) => {
    if (!session || !session._id) return;
    
    // If already processing this candidate, prevent duplicate calls
    if (processingCandidates.has(id)) {
      console.log(`Already processing candidate ${id}, ignoring duplicate request`);
      return;
    }
    
    // Create a unique toast ID for this operation
    const toastId = `accept-candidate-${id}`;
    
    try {
      // Mark this candidate as being processed
      setProcessingCandidates(prev => new Set(prev).add(id));
      
      // Dismiss any existing toast with this ID first
      toast.dismiss(toastId);
      
      // Show loading toast
      toast.loading(`Processing candidate request...`, { id: toastId });
      
      // Call the API to accept the candidate request
      const result = await candidateService.acceptCandidateRequest(session._id, id);
      
      // Show success toast with the same ID to replace the loading toast
      toast.success(result.message || "Candidate request accepted", { id: toastId });
      
      // Add a small delay before refreshing data to allow the API to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the session data first
      await fetchRefreshedSessionData();
      
      // Then reload the candidate requests
      await loadCandidateRequests();
    } catch (error: any) {
      console.error("Error accepting candidate:", error);
      toast.error(error.message || "Failed to accept candidate request", { id: toastId });
    } finally {
      // Remove this candidate from the processing set
      setProcessingCandidates(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  }
  
  // Handle rejecting a candidate request
  const handleRejectCandidate = async (id: string) => {
    if (!session || !session._id) return;
    
    // If already processing this candidate, prevent duplicate calls
    if (processingCandidates.has(id)) {
      console.log(`Already processing candidate ${id}, ignoring duplicate request`);
      return;
    }
    
    // Create a unique toast ID for this operation
    const toastId = `reject-candidate-${id}`;
    
    try {
      // Mark this candidate as being processed
      setProcessingCandidates(prev => new Set(prev).add(id));
      
      // Dismiss any existing toast with this ID first
      toast.dismiss(toastId);
      
      // Show loading toast
      toast.loading(`Processing candidate request...`, { id: toastId });
      
      // Call the API to reject the candidate request
      const result = await candidateService.rejectCandidateRequest(session._id, id);
      
      // Show success toast with the same ID to replace the loading toast
      toast.success(result.message || "Candidate request rejected", { id: toastId });
      
      // Add a small delay before refreshing data to allow the API to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the session data first
      await fetchRefreshedSessionData();
      
      // Then reload the candidate requests
      await loadCandidateRequests();
    } catch (error: any) {
      console.error("Error rejecting candidate:", error);
      toast.error(error.message || "Failed to reject candidate request", { id: toastId });
    } finally {
      // Remove this candidate from the processing set
      setProcessingCandidates(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
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

  // Function to load candidate requests directly with timeout protection
  const loadCandidateRequests = async () => {
    if (!sessionId) return;
    
    // Create a unique loading ID to prevent multiple simultaneous loads
    const loadingId = `load-candidates-${Date.now()}`;
    
    try {
      // Set loading state
      setLoadingRequests(true);
      
      // Small delay to prevent rapid loading cycles
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Candidate requests fetch timed out")), 10000)
      );
      
      console.log(`[${loadingId}] Fetching candidate requests for session ${sessionId}`);
      
      // Primary data fetch with timeout
      const requestsPromise = candidateService.getCandidateRequests(sessionId);
      const requests = await Promise.race([requestsPromise, timeoutPromise]) as any[];
      
      // Log to help debugging
      console.log(`[${loadingId}] Fetched ${Array.isArray(requests) ? requests.length : 'non-array'} candidate requests`);
      
      // Validate response
      if (!Array.isArray(requests)) {
        console.warn(`[${loadingId}] Invalid candidate requests response:`, requests);
        setCandidateRequests([]);
      } else {
      setCandidateRequests(requests);
      }
    } catch (error: any) {
      console.error(`[${loadingId}] Error loading candidate requests:`, error);
      
      // Show a toast only for network errors, not timeouts
      if (error.message !== "Candidate requests fetch timed out") {
        toast.error("Failed to load candidate requests");
      }
      
      setCandidateRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };
  
  // Load candidate requests when the nominations tab is selected
  const handleTabChange = (value: string) => {
    if (value === 'nominations' && session?.type === 'election') {
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
        
        {/* Session Tags - Now at the top of the content area, above session name */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 mb-4 z-10">
          <Badge variant="outline" className="capitalize bg-indigo-500/80 dark:bg-indigo-600/80 backdrop-blur-md text-white border-transparent">
            {session.type}
          </Badge>
          <Badge variant="outline" className="capitalize bg-violet-500/80 dark:bg-violet-600/80 backdrop-blur-md text-white border-transparent">
            {session.subtype}
          </Badge>
          <Badge className={`backdrop-blur-md border-transparent ${
            statusInfo.status === "active" ? "bg-emerald-500/80 dark:bg-emerald-600/80" : 
                            statusInfo.status === "ended" ? "bg-zinc-500/80 dark:bg-zinc-600/80" : 
            statusInfo.status === "nomination" || statusInfo.status === "pending_deployment" || statusInfo.status === "ready_to_start" ? "bg-amber-500/80 dark:bg-amber-600/80" : 
                            "bg-blue-500/80 dark:bg-blue-600/80"} text-white`}>
            {statusInfo.label}
          </Badge>
          <Badge variant={session.secretPhrase ? "outline" : "secondary"} 
                 className={`backdrop-blur-md border-transparent ${session.secretPhrase ? "bg-slate-500/80 dark:bg-slate-600/80 text-white" : "bg-teal-500/80 dark:bg-teal-600/80 text-white"}`}>
            {getSessionVisibility()}
          </Badge>
        </div>
        
        {/* Session name and description - No inline editing in banner */}
        <div className="absolute top-16 left-4 flex flex-col items-start justify-start text-left px-4 w-3/4 z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{session.name}</h1>
          <p className="text-white/90 max-w-2xl mb-2">{session.description || "No description provided"}</p>
          
          {/* Organization name */}
          {session.organizationName && (
            <div className="flex items-center gap-2 text-white/90 mt-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">{session.organizationName}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons - Bottom right corner */}
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-3 justify-end z-10">
          {/* Start Session Button */}
          {(statusInfo.status === "upcoming" || statusInfo.status === "nomination" || statusInfo.status === "pending_deployment" || statusInfo.status === "ready_to_start") && (
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
          {statusInfo.status === "active" && !session.sessionLifecycle?.endedAt && (
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
          <div className="space-y-4 border p-4 rounded-md bg-background shadow-md mt-4">
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

        <div className="backdrop-blur-md bg-background/60 rounded-xl border border-border/50 shadow-lg overflow-hidden hover:shadow-muted/20 transition-all duration-300 py-2 mt-2">
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Session Timeline
                </h3>
                
                <div className="relative">
                  {/* Timeline line - vertical */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border z-0"></div>
                  
                  <div className="relative z-10 flex flex-col space-y-4 pl-4 pr-4">
                    {/* Created event - always shown */}
                    <TimelineEvent 
                      title="Session Created"
                      date={formatDate(session.sessionLifecycle?.createdAt)}
                      isPast={true}
                    />
                    
                    {/* ELECTION SPECIFIC TIMELINE EVENTS */}
                    {session.type === "election" && (
                      <>
                        {/* Nomination phase */}
                        {session.sessionLifecycle?.scheduledAt?.start && (
                          <TimelineEvent 
                            title="Nomination Start"
                            date={formatDate(session.sessionLifecycle.scheduledAt.start)}
                            isActive={getSessionStatusFromData(session) === "nomination"}
                            isPast={new Date() > new Date(session.sessionLifecycle.scheduledAt.start)}
                            isFuture={new Date() < new Date(session.sessionLifecycle.scheduledAt.start)}
                          />
                        )}
                        
                        {session.sessionLifecycle?.scheduledAt?.end && (
                          <TimelineEvent 
                            title="Nomination End"
                            date={formatDate(session.sessionLifecycle.scheduledAt.end)}
                            isPast={new Date() > new Date(session.sessionLifecycle.scheduledAt.end)}
                            isFuture={new Date() < new Date(session.sessionLifecycle.scheduledAt.end)}
                          />
                        )}
                      </>
                    )}
                    
                    {/* POLL SPECIFIC TIMELINE EVENTS */}
                    {session.type === "poll" && (
                      <>
                        {session.sessionLifecycle?.scheduledAt?.start && !session.sessionLifecycle?.startedAt && (
                          <TimelineEvent 
                            title="Scheduled Start"
                            date={formatDate(session.sessionLifecycle.scheduledAt.start)}
                            isActive={getSessionStatusFromData(session) === "ready_to_start"}
                            isPast={new Date() > new Date(session.sessionLifecycle.scheduledAt.start)}
                            isFuture={new Date() < new Date(session.sessionLifecycle.scheduledAt.start)}
                          />
                        )}
                        
                        {session.sessionLifecycle?.scheduledAt?.end && !session.sessionLifecycle?.endedAt && (
                          <TimelineEvent 
                            title="Scheduled End"
                            date={formatDate(session.sessionLifecycle.scheduledAt.end)}
                            isPast={new Date() > new Date(session.sessionLifecycle.scheduledAt.end)}
                            isFuture={new Date() < new Date(session.sessionLifecycle.scheduledAt.end)}
                          />
                        )}
                      </>
                    )}
                    
                    {/* Blockchain Deployment */}
                    {session.contractAddress ? (
                      <TimelineEvent 
                        title="Blockchain Deployed"
                        date={`Contract: ${session.contractAddress.substring(0, 6)}...${session.contractAddress.substring(session.contractAddress.length - 4)}`}
                        isPast={true}
                      />
                    ) : getSessionStatusFromData(session) === "pending_deployment" ? (
                      <TimelineEvent 
                        title="Blockchain Deployment"
                        date="Pending deployment to blockchain"
                        isActive={true}
                      />
                    ) : (
                      <TimelineEvent 
                        title="Blockchain Deployment"
                        date="Not deployed yet"
                        isFuture={true}
                      />
                    )}
                    
                    {/* Voting start */}
                    {session.sessionLifecycle?.startedAt ? (
                      <TimelineEvent 
                        title="Voting Started"
                        date={formatDate(session.sessionLifecycle.startedAt)}
                        isActive={getSessionStatusFromData(session) === "active"}
                        isPast={getSessionStatusFromData(session) === "ended"}
                      />
                    ) : (
                      <TimelineEvent 
                        title="Voting Start"
                        date="Not started yet"
                        isFuture={true}
                      />
                    )}
                    
                    {/* Voting end */}
                    {session.sessionLifecycle?.endedAt ? (
                      <TimelineEvent 
                        title="Voting Ended"
                        date={formatDate(session.sessionLifecycle.endedAt)}
                        isPast={true}
                      />
                    ) : (
                      <TimelineEvent 
                        title="Voting End"
                        date="Not ended yet"
                        isFuture={true}
                      />
                    )}
                    
                    {/* Current status indicator */}
                    <div className="relative flex items-start p-2 border-l-2 border-primary pl-3">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">CURRENT STATUS</span>
                        <div className="mt-1">
                          <Badge className={`${statusInfo.color} px-2 py-0.5 text-xs`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Session Stats Card */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Session Statistics
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Participants Count */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {session.type === "election" ? "Candidates" : "Options"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {session.type === "election" 
                          ? ((session as Election).candidates?.length || 0) 
                          : ((session as Poll).options?.length || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Blockchain Voter Count */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Votes Cast</p>
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {session.results?.blockchainVoterCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          {session.type === "election" && (
            <TabsTrigger value="nominations" className="flex-1">Candidate Requests</TabsTrigger>
          )}
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {isEditing && editSection === 'settings' ? (
            <div className="space-y-4 border p-4 rounded-md bg-background shadow-md">
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-foreground flex items-center">
                      <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      Session Configuration
                    </h3>
                    <Button 
                      onClick={handleEditSettings}
                      variant="outline" 
                      size="sm" 
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  </div>
                  
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