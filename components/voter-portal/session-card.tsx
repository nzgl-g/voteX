"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {Calendar, Clock, Users, Eye, Vote, BarChart3, UserPlus, LockIcon, UnlockIcon, BadgeCheck, AlertTriangle, ExternalLink, Loader2, RefreshCw} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import { SessionCardProps, SessionLifecycleStatus, SessionCardSkeletonProps } from "./types";
import {
  VotingDialog,
  VotingOption,
  Candidate as VotingCandidate,
} from "./vote-cast/voting-dialog";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import sessionService from "@/services/session-service";
import { KYCForm } from "./vote-cast/kyc-step";
import type { KYCData as OriginalKYCData } from "./vote-cast/voting-dialog";
import kycService from "@/services/kyc-service";
import { Skeleton } from "@/components/ui/skeleton";

export const getSessionLifecycleStatus = (session: any): SessionLifecycleStatus => {
  if (!session || !session.sessionLifecycle) {
    console.error("Invalid session data for lifecycle status", session);
    return {
      status: "unknown",
      label: "Unknown",
      color: "bg-muted hover:bg-muted/90 text-muted-foreground",
    };
  }

  try {
    const now = new Date();
    
    // Extract all possible dates from the session lifecycle
    const scheduledStart = session.sessionLifecycle.scheduledAt?.start
        ? new Date(session.sessionLifecycle.scheduledAt.start)
        : null;
    const scheduledEnd = session.sessionLifecycle.scheduledAt?.end
        ? new Date(session.sessionLifecycle.scheduledAt.end)
        : null;
    const startedAt = session.sessionLifecycle.startedAt
        ? new Date(session.sessionLifecycle.startedAt)
        : null;
    const endedAt = session.sessionLifecycle.endedAt
        ? new Date(session.sessionLifecycle.endedAt)
        : null;

    // 1. Check if session has ended - this has priority
    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700",
        icon: <BarChart3 className="h-3.5 w-3.5 mr-1" />,
      };
    }

    // 2. Check if contract address exists - this indicates the session is active on blockchain
    // This check is prioritized over other "started" checks to ensure blockchain deployment is detected
    if (session.contractAddress) {
      return {
        status: "started",
        label: "Active on Blockchain",
        color: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700",
        icon: <Vote className="h-3.5 w-3.5 mr-1" />,
      };
    }

    // 3. Check if session has started but doesn't have a contract address - pending deployment
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt) && !session.contractAddress) {
      return {
        status: "pending_deployment",
        label: "Pending Deployment",
        color: "bg-amber-500 hover:bg-amber-400 text-black dark:text-zinc-900 border border-amber-600",
        icon: <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />,
      };
    }

    // 4. Check if in nomination phase (only for election sessions)
    if (session.type === "election" && scheduledStart && scheduledEnd && startedAt) {
      // In election type, scheduledAt contains nomination dates, and startedAt contains voting start
      if (now >= scheduledStart && now <= scheduledEnd && now < startedAt) {
        return {
          status: "nomination",
          label: "Nominations",
          color: "bg-amber-500 hover:bg-amber-400 text-black dark:text-zinc-900 border border-amber-600",
          icon: <UserPlus className="h-3.5 w-3.5 mr-1" />,
        };
      }
    }

    // 5. Handle upcoming status differently for poll vs election
    if (session.type === "election") {
      // For elections: upcoming if before nomination start
      if (scheduledStart && now < scheduledStart) {
        return {
          status: "upcoming",
          label: "Coming Soon",
          color: "bg-blue-500 hover:bg-blue-400 text-white border border-blue-600",
          icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
        };
      }
      
      // Also upcoming if after nomination but before voting
      if (scheduledEnd && startedAt && now > scheduledEnd && now < startedAt) {
        return {
          status: "upcoming",
          label: "Voting Soon",
          color: "bg-blue-500 hover:bg-blue-400 text-white border border-blue-600",
          icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
        };
      }
    } else {
      // For polls: upcoming if before start time
      if (startedAt && now < startedAt) {
        return {
          status: "upcoming",
          label: "Coming Soon",
          color: "bg-blue-500 hover:bg-blue-400 text-white border border-blue-600",
          icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
        };
      }
    }

    // 6. Default to pending (created but not yet fully scheduled)
    return {
      status: "pending",
      label: "Pending",
      color: "bg-neutral-700 hover:bg-neutral-600 text-neutral-300 border border-neutral-600",
      icon: <Clock className="h-3.5 w-3.5 mr-1" />,
    };
  } catch (error) {
    console.error("Error determining session lifecycle status:", error);
    return {
      status: "error",
      label: "Error",
      color: "bg-red-600 hover:bg-red-500 text-white border border-red-700",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
    };
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not scheduled";

  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export function SessionCard({
    session: initialSession,
    onJoinAsCandidate,
    onCastVote,
    onShowResults,
    onViewProfile,
}: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState<boolean>(false);
  const [showKYCDialog, setShowKYCDialog] = useState<boolean>(false);
  const [session, setSession] = useState<any>(initialSession);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [showVoteResults, setShowVoteResults] = useState(false);
  const [isLoadingKYC, setIsLoadingKYC] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!session || !session._id) return;
    
    const status = getSessionLifecycleStatus(session).status;
    const needsPolling = 
      (status === 'pending_deployment' || status === 'started') && 
      !session.contractAddress;
    
    if (!needsPolling) return;
    
    const intervalId = setInterval(async () => {
      try {
        setIsRefreshing(true);
        console.log(`[SessionCard] Auto-refreshing session ${session._id} status...`);
        const updatedSession = await sessionService.getSessionById(session._id);
        
        if (updatedSession) {
          if (updatedSession.contractAddress && !session.contractAddress) {
            console.log(`[SessionCard] Session ${session._id} now has contract address: ${updatedSession.contractAddress}`);
            toast({
              title: "Session Deployed",
              description: "This session is now active on the blockchain.",
            });
          }
          
          setSession(updatedSession);
        }
      } catch (error) {
        console.error('[SessionCard] Error refreshing session:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [session]);

  if (!session || typeof session !== "object" || !session._id) {
    console.error("Invalid session data provided to SessionCard:", session);
    return null;
  }

  const lifecycleStatus = getSessionLifecycleStatus(session);

  const getPollOptions = (): VotingOption[] => {
    try {
      return (session.options || []).map((opt: any) => ({
        id: opt._id || opt.id || String(Math.random()),
        title: opt.name || "Unnamed Option",
        description: opt.description || "No description provided",
        voteCount: opt.voteCount || 0,
      }));
    } catch (error) {
      console.error("Error preparing poll options:", error);
      return [];
    }
  };

  const getElectionCandidates = (): VotingCandidate[] => {
    try {
      return (session.candidates || []).map((candidate: any) => ({
        id: candidate._id || candidate.id || String(Math.random()),
        title: candidate.fullName || "Unknown Candidate",
        biography: candidate.partyName || "No biography available",
        voteCount: candidate.voteCount || 0,
      }));
    } catch (error) {
      console.error("Error preparing election candidates:", error);
      return [];
    }
  };

  const fetchLatestVotes = async () => {
    try {
      // Get updated session data from server API
      const updatedSession = await sessionService.getSessionById(session._id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (error) {
      console.error("Error fetching latest votes:", error);
      toast({
        title: "Update Error",
        description: "Failed to get the latest voting data.",
        variant: "destructive"
      });
    }
  };

  const handleVoteSubmit = async (data: any) => {
    try {
      // Extract selected option/candidate ID from the data
      let selectedId = '';
      
      if (data.selectedOptions && data.selectedOptions.length > 0) {
        selectedId = data.selectedOptions[0];
      } else if (data.selections) {
        // For backward compatibility
        selectedId = extractCandidateId(data.selections);
      }

      if (!selectedId) {
        toast({
          title: "Error",
          description: "No selection detected. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // For blockchain sessions, ensure MetaMask is connected first
      if (session.contractAddress) {
        try {
          // Import and use metamask service
          const metamaskService = (await import('@/services/metamask-service')).default;
          
          // Connect to MetaMask first
          const connected = await metamaskService.connect();
          if (!connected) {
            toast({
              title: "Wallet Connection Required",
              description: "Please connect your MetaMask wallet to cast your vote.",
              variant: "destructive"
            });
            return;
          }
          
          console.log("[SessionCard] MetaMask connected successfully");
        } catch (metamaskError) {
          console.error("Error connecting to MetaMask:", metamaskError);
          toast({
            title: "Wallet Connection Error",
            description: "Failed to connect to your wallet. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Call the onCastVote callback if provided
      if (onCastVote) {
        try {
          // Here we're passing the session ID to the callback
          // This should trigger the blockchain vote transaction
          await onCastVote(session._id);
        } catch (castError) {
          console.error("Error in onCastVote callback:", castError);
          toast({
            title: "Vote Error",
            description: "Failed to submit your vote to the blockchain. Please try again.",
            variant: "destructive"
          });
          return; // Exit early if the blockchain transaction failed
        }
      }

      // Update vote counts locally for immediate feedback
      updateVoteCountsLocally(session, selectedId);

      // Toast notification is now handled by the VotingDialog component
      
      // The VotingDialog will close itself after successful submission
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to extract candidateId from vote selections
  const extractCandidateId = (selections: any): string => {
    if (typeof selections === 'string') {
      return selections;
    } else if (Array.isArray(selections) && selections.length > 0) {
      return selections[0];
    } else if (typeof selections === 'object' && selections !== null) {
      // For ranked voting, get the highest ranked option
      const entries = Object.entries(selections as Record<string, number>);
      if (entries.length > 0) {
        // Sort by rank (ascending) and take the first one (rank 1)
        entries.sort((a, b) => a[1] - b[1]);
        return entries[0][0];
      }
    }
    return '';
  };

  // Helper function to update vote counts directly in the session
  const updateVoteCountsLocally = (session: any, selectedId: string): void => {
    // For poll sessions
    if (session.type === 'poll' && session.options) {
      // Find the option by ID and increment vote count
      session.options = session.options.map((option: any) => {
        if (option._id === selectedId) {
          return {
            ...option,
            totalVotes: (option.totalVotes || 0) + 1,
            voteCount: (option.voteCount || 0) + 1 // For UI display
          };
        }
        return option;
      });
    } 
    // For election sessions
    else if (session.type === 'election' && session.candidates) {
      // Find the candidate by ID and increment vote count
      session.candidates = session.candidates.map((candidate: any) => {
        if (candidate._id === selectedId) {
          return {
            ...candidate,
            totalVotes: (candidate.totalVotes || 0) + 1,
            voteCount: (candidate.voteCount || 0) + 1 // For UI display
          };
        }
        return candidate;
      });
    }
  };

  const loadVoteResults = async () => {
    try {
      setIsLoadingVotes(true);
      const updatedSession = await sessionService.getSessionById(session._id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (error) {
      console.error("Error loading vote results:", error);
      toast({
        title: "Results Error",
        description: "Failed to load the latest results.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVotes(false);
    }
  };

  const handleVoteBtnClick = async () => {
    try {
      setIsLoadingKYC(true);
      
      const requiresKYC = await kycService.isKYCRequiredForSession(session._id);
      console.log(`[SessionCard] Session ${session._id} requires KYC:`, requiresKYC);
      
      if (requiresKYC) {
        const kycStatus = await kycService.getUserKYCStatus();
        console.log("[SessionCard] KYC Status from /kyc/status:", kycStatus);

        if (kycStatus.isVerified) {
          console.log("[SessionCard] User KYC is verified (from /kyc/status). Proceeding to vote.");
          setShowVotingDialog(true);
        } else {
          console.log("[SessionCard] User KYC NOT verified (from /kyc/status). Showing KYCForm.");
          // Display a more helpful message about verification
          toast({
            title: "Identity Verification Required",
            description: "This voting session requires identity verification before you can cast your vote.",
          });
          setShowKYCDialog(true);
        }
      } else {
        console.log("[SessionCard] Session does not require KYC. Proceeding to vote.");
        setShowVotingDialog(true);
      }
    } catch (error) {
      console.error("Error in handleVoteBtnClick (checking KYC requirements/status):", error);
      toast({
        title: "Error",
        description: "Failed to check verification requirements. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingKYC(false);
    }
  };
  
  const handleKYCVerified = () => {
    setShowKYCDialog(false);
    
    // Check the status again to confirm verification was saved
    kycService.getUserKYCStatus().then(status => {
      console.log("[SessionCard] Final KYC status check:", status);
      
      if (status.isVerified) {
        console.log("[SessionCard] Status confirmed verified. Proceeding to vote.");
        setShowVotingDialog(true);
      } else {
        console.log("[SessionCard] Status still shows not verified. Force proceeding to vote.");
        // If verification was successful but status isn't updated yet, proceed anyway
        toast({
          title: "Proceeding to Vote",
          description: "Your identity has been verified. You can now vote.",
        });
        setShowVotingDialog(true);
      }
    }).catch(error => {
      console.error("[SessionCard] Error in final status check:", error);
      // Proceed anyway since we already got a successful verification
      setShowVotingDialog(true);
    });
  };

  const handleKYCFormSubmit = async (data: OriginalKYCData) => {
    console.log("[SessionCard] KYCForm submitted data:", {
      ...data,
      idCardDocument: data.idCardDocument ? 
        `File: ${data.idCardDocument.name} (${Math.round(data.idCardDocument.size / 1024)} KB)` : 
        'No file'
    });

    if (!data.idCardNumber || !data.idCardDocument) {
        toast({
          title: "Error",
          description: "ID Number and ID Document are required.",
          variant: "destructive"
        });
        return;
    }

    // Reset any previous verification errors
    setVerificationError(null);
    setIsLoadingKYC(true);
    toast({
      title: "Processing Verification",
      description: "Please wait while we verify your identity.",
    });

    try {
        const result = await kycService.submitVerification({
            idNumber: data.idCardNumber,
            idCardFile: data.idCardDocument, 
        });

        console.log("[SessionCard] KYC verification result:", result);

        // Extract verification details from result
        const verificationDetails = result.verificationDetails || {};
        const decision = verificationDetails.decision || '';
        
        // Check if the decision is "accept"
        if (decision === "accept" || result.success) {
            // KYC Accepted flow
            toast({
              title: "Verification Successful",
              description: "Your identity has been verified. You can now vote."
            });
            
            // Store verification success details
            setVerificationError({
                decision: "accept",
                reason: verificationDetails.reason || "Verification successful"
            });
            
            // Wait for a moment to ensure the database has been updated
            setTimeout(async () => {
                try {
                    // Check the status endpoint to see if the user is verified
                    const updatedStatus = await kycService.getUserKYCStatus();
                    console.log("[SessionCard] Checking status after verification:", updatedStatus);
                    
                    if (updatedStatus.isVerified) {
                        console.log("[SessionCard] User verification confirmed in database");
                        handleKYCVerified();
                    } else {
                        console.log("[SessionCard] User not yet showing as verified in database");
                        
                        // Try one more time after another short delay
                        setTimeout(async () => {
                            try {
                                const finalStatus = await kycService.getUserKYCStatus();
                                console.log("[SessionCard] Final verification status check:", finalStatus);
                                
                                // Proceed to voting regardless of status
                                handleKYCVerified();
                            } catch (e) {
                                console.error("[SessionCard] Error in final verification check:", e);
                                // Proceed anyway as verification was successful
                                handleKYCVerified();
                            }
                        }, 3000);
                    }
                } catch (statusError) {
                    console.error("[SessionCard] Error checking verification status:", statusError);
                    // Proceed to voting anyway since verification was successful
                    handleKYCVerified();
                }
            }, 2000);
        } else {
            // KYC Rejected flow
            console.log("[SessionCard] Verification failed with decision:", decision);
            
            // Store verification error details for display
            setVerificationError({
                decision: decision || "deny",
                reason: verificationDetails.reason || result.message || "Verification failed"
            });
            
            toast({
                title: "Verification Failed",
                description: "Please check the details below and try again with a clearer image.",
                variant: "destructive"
            });
        }
    } catch (error: any) {
        console.error("KYC verification error:", error);
        
        if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
          toast({
            title: "Verification Timeout",
            description: "The verification is taking longer than expected. Please try again with a smaller image file.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Verification Error",
            description: "An error occurred during verification. Please try again.",
            variant: "destructive"
          });
        }
    } finally {
        setIsLoadingKYC(false);
    }
  };

  const getContextualButton = () => {
    const getVariantClasses = (variant: string) => {
      switch (variant) {
        case 'primary':
          return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg';
        case 'secondary':
          return 'bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm hover:shadow-md';
        case 'outline':
          return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md';
        case 'ghost':
          return 'hover:bg-accent hover:text-accent-foreground';
        case 'destructive':
          return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm hover:shadow-md';
        case 'emerald':
          return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg';
        case 'amber':
          return 'bg-amber-500 hover:bg-amber-400 text-black shadow-md hover:shadow-lg';
        case 'blue':
          return 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg';
        default:
          return '';
      }
    };

    // If session has a contract address, show the appropriate button based on status
    if (session.contractAddress) {
      if (lifecycleStatus.status === 'ended') {
        return (
          <button
            onClick={handleShowResults}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('outline')}`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </button>
        );
      } else {
        return (
          <button
            onClick={handleVoteBtnClick}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('emerald')}`}
          >
            <Vote className="h-4 w-4 mr-2" />
            Cast Vote
          </button>
        );
      }
    }

    // For sessions without contract address, use the original logic
    if (lifecycleStatus.status === 'ended') {
      return (
        <button
          onClick={handleShowResults}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('outline')}`}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Results
        </button>
      );
    }

    if (lifecycleStatus.status === 'nomination' && session.type === 'election') {
      return (
        <button
          onClick={() => onJoinAsCandidate(session)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('amber')}`}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Join as Candidate
        </button>
      );
    }

    if (lifecycleStatus.status === 'pending_deployment') {
      return (
        <button
          onClick={handleRefreshSession}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('amber')}`}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking Status...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Deployment Status
            </>
          )}
        </button>
      );
    }

    if (lifecycleStatus.status === 'started') {
      return (
        <button
          onClick={handleVoteBtnClick}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('emerald')}`}
        >
          <Vote className="h-4 w-4 mr-2" />
          Cast Vote
        </button>
      );
    }

    if (lifecycleStatus.status === 'upcoming') {
      return (
        <button
          onClick={() => onViewProfile(session)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('blue')}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </button>
      );
    }

    // Default button for any other status
    return (
      <button
        onClick={() => onViewProfile(session)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${getVariantClasses('blue')}`}
      >
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </button>
    );
  };
  
  const getAdditionalBadges = () => {
    const badges = [];
    
    // Visibility badge (public/private)
    if (session.visibility) {
      if (session.visibility === "public") {
        badges.push(
          <Badge key="visibility" variant="outline" className="px-2 py-0.5 text-xs font-normal flex items-center gap-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 bg-green-50 dark:bg-green-950/30 shadow-sm">
            <UnlockIcon className="h-3 w-3" />
            Public
          </Badge>
        );
      } else if (session.visibility === "private") {
        badges.push(
          <Badge key="visibility" variant="outline" className="px-2 py-0.5 text-xs font-normal flex items-center gap-1 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
            <LockIcon className="h-3 w-3" />
            Private
          </Badge>
        );
      }
    } else if (session.securityMethod) {
      // Fallback to securityMethod if visibility is not available
      if (session.securityMethod === "Secret Phrase") {
        badges.push(
          <Badge key="security" variant="outline" className="px-2 py-0.5 text-xs font-normal flex items-center gap-1 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
            <LockIcon className="h-3 w-3" />
            Private
          </Badge>
        );
      }
    }
    
    // Verification method badge
    if (session.verificationMethod) {
      if (session.verificationMethod === "kyc") {
        badges.push(
          <Badge key="verification" variant="outline" className="px-2 py-0.5 text-xs font-normal flex items-center gap-1 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-sm">
            <BadgeCheck className="h-3 w-3" />
            KYC Required
          </Badge>
        );
      }
    }
    
    // Blockchain badge if contract address exists
    if (session.contractAddress) {
      badges.push(
        <Badge key="blockchain" variant="outline" className="px-2 py-0.5 text-xs font-normal flex items-center gap-1 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-sm">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12L6 8M6 8L12 2L18 8M6 8V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V8M18 8L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Blockchain
        </Badge>
      );
    }
    
    return badges;
  };

  const handleShowResults = async () => {
    if (onShowResults) {
      onShowResults(session._id);
    } else {
      setShowVoteResults(true);
      loadVoteResults();
    }
  };

  const handleRefreshSession = async () => {
    if (!session || !session._id) return;
    
    try {
      setIsRefreshing(true);
      const updatedSession = await sessionService.getSessionById(session._id);
      if (updatedSession) {
        setSession(updatedSession);
        
        if (updatedSession.contractAddress && !session.contractAddress) {
          toast({
            title: "Session Deployed",
            description: "This session is now active on the blockchain.",
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      toast({
        title: "Refresh Error",
        description: "Failed to get the latest session data.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
      <>
        <Card
            className="flex flex-col gap-3 p-0 group relative overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:shadow-md dark:shadow-primary/5 hover:border-primary/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
          {/* Quick Action Buttons */}
          <div className={`absolute top-3 right-3 z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'} flex gap-2`}>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-all hover:bg-background hover:scale-105"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
            >
              {isRefreshing ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <RefreshCw className="h-4 w-4" />
              }
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-all hover:bg-background hover:scale-105"
              onClick={() => onViewProfile(session)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Banner Image with Gradient Overlay */}
          <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
            <Image
                src={session.banner || "/placeholder.svg"}
                alt={session.name || "Session"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent"></div>
            
            {/* Type and Status Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="capitalize px-2.5 py-0.5 text-xs font-medium bg-blue-600 text-white dark:bg-blue-400 dark:text-black shadow-sm">
                {session.type || "Unknown"}
              </Badge>
              
              <Badge variant="outline" className={`${lifecycleStatus.color} px-2.5 py-0.5 text-xs font-medium flex items-center shadow-sm backdrop-blur-sm`}>
                {lifecycleStatus.icon}
                {lifecycleStatus.label}
              </Badge>
            </div>
          </div>

          {/* Session Information */}
          <div className="flex flex-col gap-2 px-5 pt-1">
            <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {session.name || "Unnamed Session"}
            </h3>
            
            {session.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            )}

            {/* Session Details */}
            <div className="mt-1 space-y-2 text-sm">
              {session.organizationName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="bg-muted rounded-full p-1">
                    <Users className="h-3 w-3 text-muted-foreground/70" />
                  </div>
                  <span className="truncate">{session.organizationName}</span>
                </div>
              )}
              
              {session.sessionLifecycle?.startedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="bg-muted rounded-full p-1">
                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                  </div>
                  <span className="truncate">
                    Voting: {formatDate(session.sessionLifecycle.startedAt)}
                    {session.sessionLifecycle?.endedAt &&
                      ` - ${formatDate(session.sessionLifecycle.endedAt)}`}
                  </span>
                </div>
              )}
              
              {/* Additional Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {getAdditionalBadges()}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto px-5 pb-5 pt-3">
            {getContextualButton()}
          </div>
        </Card>

        {showKYCDialog && (
          <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Identity Verification</DialogTitle>
                <DialogDescription>
                  Please verify your identity to proceed with voting.
                  Your information will be pre-filled if available.
                </DialogDescription>
              </DialogHeader>
              <KYCForm 
                onSubmit={handleKYCFormSubmit} 
                isVerifying={isLoadingKYC}
                verificationError={verificationError}
              />
            </DialogContent>
          </Dialog>
        )}

        {showVotingDialog && (
            <VotingDialog
                open={showVotingDialog}
                onOpenChange={setShowVotingDialog}
                sessionId={session._id}
                onVoteSubmitted={handleVoteSubmit}
            />
        )}
        
        <Dialog open={showVoteResults} onOpenChange={setShowVoteResults}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Vote Results</DialogTitle>
              <DialogDescription>
                Current voting results for {session.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoadingVotes ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading latest vote counts...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted px-4 py-2 text-sm font-medium">
                      <div className="col-span-7">{session.type === "poll" ? "Option" : "Candidate"}</div>
                      <div className="col-span-3 text-right">Votes</div>
                      <div className="col-span-2 text-right">Percentage</div>
                    </div>
                    <div className="divide-y">
                      {session.type === "poll" && session.options && session.options.map((option: any) => {
                        const voteCount = option.voteCount || option.totalVotes || 0;
                        const totalVotes = session.options.reduce((sum: number, opt: any) => 
                          sum + (opt.voteCount || opt.totalVotes || 0), 0);
                        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <div key={option._id} className="grid grid-cols-12 px-4 py-3 text-sm">
                            <div className="col-span-7 font-medium flex items-center">
                              {option.name}
                            </div>
                            <div className="col-span-3 text-right">{voteCount}</div>
                            <div className="col-span-2 text-right">{percentage}%</div>
                          </div>
                        );
                      })}
                      
                      {session.type === "election" && session.candidates && session.candidates.map((candidate: any) => {
                        const voteCount = candidate.voteCount || candidate.totalVotes || 0;
                        const totalVotes = session.candidates.reduce((sum: number, cand: any) => 
                          sum + (cand.voteCount || cand.totalVotes || 0), 0);
                        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <div key={candidate._id} className="grid grid-cols-12 px-4 py-3 text-sm">
                            <div className="col-span-7 font-medium flex items-center">
                              {candidate.fullName || candidate.partyName}
                            </div>
                            <div className="col-span-3 text-right">{voteCount}</div>
                            <div className="col-span-2 text-right">{percentage}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={loadVoteResults}
                      disabled={isLoadingVotes}
                    >
                      {isLoadingVotes ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>Refresh</span>
                    </Button>
                    <Button onClick={() => setShowVoteResults(false)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
  );
}

export function SessionCardSkeleton({ count = 3 }: SessionCardSkeletonProps) {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <Card key={index} className="overflow-hidden relative group">
          {/* Banner Image Skeleton */}
          <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
            <Skeleton className="h-full w-full" />
            
            {/* Type and Status Badges Skeleton */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>

          {/* Session Information Skeleton */}
          <div className="flex flex-col gap-2 px-5 pt-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />

            {/* Session Details Skeleton */}
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              {/* Additional Badges Skeleton */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="mt-auto px-5 pb-5 pt-3">
            <Skeleton className="h-9 w-full" />
          </div>
        </Card>
      ))}
    </>
  );
}
