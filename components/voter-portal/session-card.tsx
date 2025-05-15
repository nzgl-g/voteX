"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {Calendar, Clock, Users, Eye, Vote, BarChart3, UserPlus, LockIcon, UnlockIcon, BadgeCheck, AlertTriangle, ExternalLink, Loader2, RefreshCw} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import { SessionCardProps, SessionLifecycleStatus } from "./types";
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
    if (session.contractAddress) {
      return {
        status: "started",
        label: "Active",
        color: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700",
        icon: <Vote className="h-3.5 w-3.5 mr-1" />,
      };
    }

    // 3. Check if session has started and is currently active (fallback if no contract address)
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "started",
        label: "Active",
        color: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700",
        icon: <Vote className="h-3.5 w-3.5 mr-1" />,
      };
    }

    // 4. Check if in nomination phase (only for election sessions with scheduled dates)
    if (session.type === "election" && scheduledStart && scheduledEnd) {
      if (now >= scheduledStart && now <= scheduledEnd) {
        return {
          status: "nomination",
          label: "Nominations",
          color: "bg-amber-500 hover:bg-amber-400 text-black dark:text-zinc-900 border border-amber-600",
          icon: <UserPlus className="h-3.5 w-3.5 mr-1" />,
        };
      }
    }

    // 5. Check if session is upcoming (before nomination or start time)
    if ((session.type === "election" && scheduledStart && now < scheduledStart) || 
        (!startedAt && !scheduledStart)) {
      return {
        status: "upcoming",
        label: "Coming Soon",
        color: "bg-blue-500 hover:bg-blue-400 text-white border border-blue-600",
        icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
      };
    }

    // 6. Default to pending (created but not yet active)
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

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

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
      
      if (data.selections) {
        // For backward compatibility
        selectedId = extractCandidateId(data.selections);
      } else if (data.selectedOptions && data.selectedOptions.length > 0) {
        // For the new format
        selectedId = data.selectedOptions[0];
      }

      if (!selectedId) {
        toast({
          title: "Error",
          description: "No selection detected. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Call the onCastVote callback if provided
      if (onCastVote) {
        await onCastVote(session._id);
      }

      // Update vote counts locally for immediate feedback
      updateVoteCountsLocally(session, selectedId);

      toast({
        title: "Vote Submitted",
        description: "Your vote has been successfully recorded.",
      });

      // Close the voting dialog
      setShowVotingDialog(false);
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
    const buttonBaseClasses = "w-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";

    const getVariantClasses = (variant: string) => {
      const base = "flex items-center justify-center font-medium rounded-lg px-4 py-2.5 shadow-sm";
      switch(variant) {
        case "default":
          return `${base} bg-primary hover:bg-primary/90 text-white focus:ring-primary/30`;
        case "outline":
          return `${base} border border-primary/50 bg-background text-primary hover:bg-primary/5 focus:ring-primary/30`;
        case "secondary":
          return `${base} bg-secondary hover:bg-secondary/90 text-white focus:ring-secondary/30`;
        case "destructive":
          return `${base} bg-destructive hover:bg-destructive/90 text-white focus:ring-destructive/30`;
        default:
          return base;
      }
    };

    if (lifecycleStatus.status === "nomination" && session.type === "election") {
      return (
          <Button
              className={`${buttonBaseClasses} ${getVariantClasses("secondary")}`}
              onClick={() => onJoinAsCandidate(session)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Join as Candidate</span>
          </Button>
      );
    }

    if (lifecycleStatus.status === "started") {
      return (
        <Button
          className={`${buttonBaseClasses} ${getVariantClasses("default")}`}
          onClick={handleVoteBtnClick}
          disabled={isLoadingKYC}
        >
          {isLoadingKYC ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Vote className="h-4 w-4 mr-2" />
          )}
          <span>{isLoadingKYC ? "Preparing..." : "Cast Your Vote"}</span>
        </Button>
      );
    }

    if (lifecycleStatus.status === "ended") {
      return (
          <Button
              className={`${buttonBaseClasses} ${getVariantClasses("secondary")}`}
              onClick={() => onShowResults(session)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            <span>Show Results</span>
          </Button>
      );
    }

    return (
        <Button
            className={`${buttonBaseClasses} ${getVariantClasses("outline")}`}
            onClick={() => onViewProfile(session)}
        >
          <Eye className="h-4 w-4 mr-2" />
          <span>View Details</span>
        </Button>
    );
  };
  
  const getAdditionalBadges = () => {
    const badges = [];
    
    if (session.securityMethod === 'Secret Phrase') {
      badges.push(
        <Badge key="security" variant="outline" className="px-2 py-1 text-xs bg-purple-600/10 text-purple-600 border-purple-600/30 flex items-center gap-1">
          <LockIcon className="h-3 w-3" />
          Private
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="security" variant="outline" className="px-2 py-1 text-xs bg-green-600/10 text-green-600 border-green-600/30 flex items-center gap-1">
          <UnlockIcon className="h-3 w-3" />
          Public
        </Badge>
      );
    }
    
    if (session.verificationMethod === 'kyc' || session.verificationMethod === 'KYC') {
      badges.push(
        <Badge key="verification" variant="outline" className="px-2 py-1 text-xs bg-blue-600/10 text-blue-600 border-blue-600/30 flex items-center gap-1">
          <BadgeCheck className="h-3 w-3" />
          KYC
        </Badge>
      );
    }
    
    if (session.contractAddress) {
      badges.push(
        <Badge key="blockchain" variant="outline" className="px-2 py-1 text-xs bg-emerald-600/10 text-emerald-600 border-emerald-600/30 flex items-center gap-1" title={session.contractAddress}>
          <ExternalLink className="h-3 w-3" />
          On-Chain
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

  return (
      <>
        <Card
            className="flex flex-col gap-3 p-0 group relative overflow-hidden rounded-lg border bg-background shadow transition-all hover:shadow-md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && (
            <div className="absolute top-3 right-3 z-10">
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all hover:bg-background"
                onClick={() => onViewProfile(session)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="relative h-36 w-full overflow-hidden">
            <Image
                src={session.banner || "/placeholder.svg"}
                alt={session.name || "Session"}
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
            
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="capitalize px-2.5 py-0.5 text-xs font-medium bg-blue-600 text-white dark:bg-blue-400 dark:text-black">
                {session.type || "Unknown"}
              </Badge>
              
              <Badge variant="outline" className={`${lifecycleStatus.color} px-2.5 py-0.5 text-xs font-medium flex items-center`}>
                {lifecycleStatus.icon}
                {lifecycleStatus.label}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-4">
            <h3 className="text-lg font-semibold line-clamp-1">
              {session.name || "Unnamed Session"}
            </h3>
            
            {session.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            )}

            <div className="mt-1 space-y-1.5 text-sm">
              {session.organizationName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="truncate">{session.organizationName}</span>
                </div>
              )}
              
              {session.sessionLifecycle?.startedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="truncate">
                    Voting: {formatDate(session.sessionLifecycle.startedAt)}
                    {session.sessionLifecycle?.endedAt &&
                      ` - ${formatDate(session.sessionLifecycle.endedAt)}`}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1.5">
                {getAdditionalBadges()}
              </div>
            </div>
          </div>

          <div className="mt-auto px-4 pb-4 pt-1">
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
