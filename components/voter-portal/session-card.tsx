"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {Calendar, Clock, Users, Eye, Vote, BarChart3, UserPlus, LockIcon, UnlockIcon, BadgeCheck, AlertTriangle, ExternalLink, Loader2, RefreshCw, Database, BlocksIcon, Lock} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SessionCardProps, SessionLifecycleStatus } from "./types";
import {
  VotingDialog,
  VotingOption,
  Candidate as VotingCandidate,
} from "./vote-cast/voting-dialog";
import { blockchainService } from "@/services/blockchain-service";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sessionService } from "@/services/session-service";
import { blockchainSyncService } from '@/services/blockchain-sync-service';

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

    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700",
        icon: <BarChart3 className="h-3.5 w-3.5 mr-1" />,
      };
    }

    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "started",
        label: "Active",
        color: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700",
        icon: <Vote className="h-3.5 w-3.5 mr-1" />,
      };
    }

    if (scheduledStart && now >= scheduledStart) {
      if (!scheduledEnd || now <= scheduledEnd) {
        return {
          status: "nomination",
          label: "Nominations",
          color: "bg-amber-500 hover:bg-amber-400 text-black dark:text-zinc-900 border border-amber-600",
          icon: <UserPlus className="h-3.5 w-3.5 mr-1" />,
        };
      }
    }

    if (scheduledStart && now < scheduledStart) {
      return {
        status: "upcoming",
        label: "Coming Soon",
        color: "bg-blue-500 hover:bg-blue-400 text-white border border-blue-600",
        icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
      };
    }

    if (!startedAt) {
      return {
        status: "pending",
        label: "Pending",
        color: "bg-neutral-700 hover:bg-neutral-600 text-neutral-300 border border-neutral-600",
        icon: <Clock className="h-3.5 w-3.5 mr-1" />,
      };
    }

    return {
      status: "unknown",
      label: "Not Scheduled",
      color: "bg-neutral-700 hover:bg-neutral-600 text-neutral-300 border border-neutral-600",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
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
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showBlockchainDialog, setShowBlockchainDialog] = useState(false);
  const [voteData, setVoteData] = useState<any>(null);
  const [session, setSession] = useState<any>(initialSession);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [showVoteResults, setShowVoteResults] = useState(false);

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
    if (!session._id) return;
    
    setIsLoadingVotes(true);
    console.log("Fetching latest vote data...");
    
    try {
      // Attempt to get the updated session with latest votes
      const updatedSession = await sessionService.getSessionById(session._id);
      
      if (!updatedSession) {
        console.error("Failed to get updated session");
        toast({
          title: "Error",
          description: "Could not refresh vote data. Please try again.",
          variant: "destructive"
        });
        setIsLoadingVotes(false);
        return;
      }
      
      // If the session has a blockchain contract, fetch blockchain data too
      if (updatedSession.contractAddress) {
        console.log("Fetching vote counts from blockchain...");
        try {
          // Use the blockchain sync service to update vote counts
          await blockchainSyncService.syncBlockchainData(updatedSession._id as string, true);
          
          // Fetch the session again to get the updated data
          const syncedSession = await sessionService.getSessionById(updatedSession._id as string);
          setSession(syncedSession);
        } catch (blockchainError) {
          console.error("Error syncing with blockchain:", blockchainError);
          // Still use the regular session data even if blockchain sync fails
          setSession(updatedSession);
        }
      } else {
        // Just use the database session if no blockchain contract
        setSession(updatedSession);
      }
    } catch (error) {
      console.error("Error fetching latest votes:", error);
      toast({
        title: "Update Failed",
        description: "Could not refresh vote data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVotes(false);
    }
  };

  const handleVoteSubmit = async (data: any) => {
    console.log("Vote submitted:", data);
    try {
      // Store vote data for later use
      setVoteData(data);
      
      // Start the blockchain voting process
      await connectWalletForVoting();
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Vote Error",
        description: "Failed to process your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  const connectWalletForVoting = async () => {
    setIsBlockchainLoading(true);
    try {
      // Connect to blockchain via MetaMask
      console.log("Connecting to MetaMask...");
      const connected = await blockchainService.connect();
      if (!connected) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to blockchain. Please make sure MetaMask is installed and unlocked.",
          variant: "destructive"
        });
        setIsBlockchainLoading(false);
        return;
      }
      
      console.log("Successfully connected to MetaMask");
      
      // Get the wallet address
      const address = await blockchainService.getWalletAddress();
      console.log("Wallet address:", address);
      setWalletAddress(address);
      
      // Show blockchain confirmation dialog
      setShowBlockchainDialog(true);
    } catch (error) {
      console.error("Blockchain connection error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to blockchain. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBlockchainLoading(false);
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
            voteCount: (option.voteCount || 0) + 1, // For UI display
            blockchainVerified: true
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
            voteCount: (candidate.voteCount || 0) + 1, // For UI display
            blockchainVerified: true
          };
        }
        return candidate;
      });
    }
  };

  const confirmBlockchainVote = async () => {
    if (!voteData || !session.contractAddress) {
      setShowBlockchainDialog(false);
      return;
    }
    
    setIsBlockchainLoading(true);
    
    try {
      console.log("Confirming blockchain vote:", voteData);
      
      // Cast vote on blockchain
      const blockchainSuccess = await blockchainService.castVote(
        session.contractAddress,
        voteData.selections
      );
      
      if (!blockchainSuccess) {
        console.error("Blockchain vote failed");
        toast({
          title: "Vote Failed",
          description: "Your vote could not be recorded on the blockchain.",
          variant: "destructive"
        });
        setShowBlockchainDialog(false);
        setIsBlockchainLoading(false);
        return;
      }
      
      console.log("Blockchain vote successful. Now updating backend...");
      
      // Identify the selected option/candidate
      const selectedId = extractCandidateId(voteData.selections);
      console.log("Selected ID:", selectedId);
      
      try {
        // Update vote in backend
        const backendSuccess = await sessionService.castVote(session._id, { candidateId: selectedId });
        
        if (backendSuccess) {
          console.log("Backend vote update successful");
          toast({
            title: "Vote Cast Successfully",
            description: "Your vote has been recorded on the blockchain and in our system.",
            variant: "default"
          });
        } else {
          console.warn("Backend vote update failed, but blockchain vote succeeded");
          // Update vote count locally in the session object to reflect blockchain vote
          updateVoteCountsLocally(session, selectedId);
          setSession({...session});
          
          toast({
            title: "Vote Partially Recorded",
            description: "Your vote was recorded on the blockchain but our system could not be updated. The displayed counts have been updated locally.",
            variant: "default"
          });
        }
      } catch (backendError) {
        console.error("Backend error:", backendError);
        // Update vote count locally in the session object to reflect blockchain vote
        updateVoteCountsLocally(session, selectedId);
        setSession({...session});
        
        toast({
          title: "Vote Recorded on Blockchain",
          description: "Your vote is secure on the blockchain, but our database couldn't be updated. The displayed counts have been updated locally.",
          variant: "default"
        });
      }
      
      // Close the voting dialog
      setShowBlockchainDialog(false);
      setShowVotingDialog(false);
      
      // Show results after successful vote
      setTimeout(() => {
        setShowVoteResults(true);
      }, 500);
      
    } catch (error) {
      console.error("Error in vote confirmation process:", error);
      toast({
        title: "Vote Error",
        description: "An error occurred while processing your vote. Please try again.",
        variant: "destructive"
      });
      
    } finally {
      setIsBlockchainLoading(false);
    }
  };
  
  const loadVoteResults = async () => {
    setIsLoadingVotes(true);
    try {
      // First try to get results from blockchain if contract address exists
      if (session.contractAddress) {
        try {
          console.log("Getting vote results from blockchain...");
          const blockchainResults = await blockchainService.getVoteResults(session.contractAddress);
          
          if (blockchainResults) {
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
            
            // Update the session with blockchain data
            setSession(updatedSession);
          }
        } catch (blockchainError) {
          console.error("Error getting blockchain results:", blockchainError);
          // Continue to use backend results if blockchain fails
        }
      }
      
      // Get results from backend
      const updatedSession = await sessionService.getSessionById(session._id);
      if (updatedSession) {
        const typedUpdatedSession = updatedSession as any;
        const typedSession = session as any;
        
        // Only update fields that don't have blockchain verification
        if (session.type === 'election' && typedUpdatedSession.candidates && typedSession.candidates) {
          typedUpdatedSession.candidates = typedUpdatedSession.candidates.map((candidate: any) => {
            // Find matching candidate in our session that might have blockchain verification
            const existingCandidate = typedSession.candidates.find((c: any) => c._id === candidate._id);
            if (existingCandidate && existingCandidate.blockchainVerified) {
              // Keep the blockchain verified data
              return existingCandidate;
            }
            return candidate;
          });
        } else if (session.type === 'poll' && typedUpdatedSession.options && typedSession.options) {
          typedUpdatedSession.options = typedUpdatedSession.options.map((option: any) => {
            // Find matching option in our session that might have blockchain verification
            const existingOption = typedSession.options.find((o: any) => o._id === option._id);
            if (existingOption && existingOption.blockchainVerified) {
              // Keep the blockchain verified data
              return existingOption;
            }
            return option;
          });
        }
        
        setSession(typedUpdatedSession);
      }
    } catch (error) {
      console.error("Error loading vote results:", error);
      toast({
        title: "Error",
        description: "Failed to load the latest vote results.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVotes(false);
    }
  };

  // Helper function to map selection IDs to candidate names/IDs for the blockchain
  const mapVoteSelectionsToCandidates = (selections: string | string[] | Record<string, number>, candidates: any[]) => {
    // Create a map of candidate IDs to names
    const candidateMap = candidates.reduce((map, candidate) => {
      if (candidate._id) {
        // Use the candidate's name for blockchain submission, not the ID
        map[candidate._id] = candidate.fullName || candidate.partyName || candidate.user?.username || candidate._id;
      }
      return map;
    }, {} as Record<string, string>);
    
    console.log("Candidate ID to name mapping:", candidateMap);
    
    // Convert selections to string[] format
    let selectionArray: string[];
    
    if (Array.isArray(selections)) {
      selectionArray = selections;
    } else if (typeof selections === 'object' && selections !== null) {
      // For ranked voting, sort by rank
      selectionArray = Object.entries(selections)
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id);
    } else if (typeof selections === 'string') {
      // Single selection
      selectionArray = [selections];
    } else {
      // Handle undefined or null
      console.error("Invalid selections format:", selections);
      selectionArray = [];
    }
    
    // Map IDs to names when possible
    const mappedSelections = selectionArray.map(id => candidateMap[id] || id);
    console.log("Original selections:", selectionArray);
    console.log("Mapped to blockchain names:", mappedSelections);
    
    return mappedSelections;
  };

  // Helper function to map selection IDs to option names/IDs for the blockchain
  const mapVoteSelectionsToOptions = (selections: string | string[] | Record<string, number>, options: any[]) => {
    // Create a map of option IDs to names
    const optionMap = options.reduce((map, option) => {
      if (option._id) {
        // Use the option's name for blockchain submission, not the ID
        map[option._id] = option.name || option._id;
      }
      return map;
    }, {} as Record<string, string>);
    
    console.log("Option ID to name mapping:", optionMap);
    
    // Convert selections to string[] format
    let selectionArray: string[];
    
    if (Array.isArray(selections)) {
      selectionArray = selections;
    } else if (typeof selections === 'object' && selections !== null) {
      // For ranked voting, sort by rank
      selectionArray = Object.entries(selections)
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id);
    } else if (typeof selections === 'string') {
      // Single selection
      selectionArray = [selections];
    } else {
      // Handle undefined or null
      console.error("Invalid selections format:", selections);
      selectionArray = [];
    }
    
    // Map IDs to names when possible
    const mappedSelections = selectionArray.map(id => optionMap[id] || id);
    console.log("Original selections:", selectionArray);
    console.log("Mapped to blockchain names:", mappedSelections);
    
    return mappedSelections;
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
              onClick={() => setShowVotingDialog(true)}
          >
            <Vote className="h-4 w-4 mr-2" />
            <span>Cast Your Vote</span>
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
    
    if (session.verificationMethod === 'KYC') {
      badges.push(
        <Badge key="verification" variant="outline" className="px-2 py-1 text-xs bg-blue-600/10 text-blue-600 border-blue-600/30 flex items-center gap-1">
          <BadgeCheck className="h-3 w-3" />
          KYC
        </Badge>
      );
    }
    
    return badges;
  };

  const handleShowResults = async () => {
    setIsLoadingVotes(true);
    try {
      await fetchLatestVotes();
      setShowVoteResults(true);
    } catch (error) {
      console.error("Error showing results:", error);
      toast({
        title: "Error",
        description: "Could not load voting results. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVotes(false);
    }
  };

  // Set up automatic blockchain sync when viewing results
  useEffect(() => {
    if (showVoteResults && session._id && session.contractAddress) {
      // Start automatic sync
      blockchainSyncService.startAutoSync(session._id);
      
      // Stop when dialog is closed
      return () => {
        blockchainSyncService.stopAutoSync();
      };
    }
  }, [showVoteResults, session._id, session.contractAddress]);

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

        {showVotingDialog && (
            <VotingDialog
                open={showVotingDialog}
                onOpenChange={setShowVotingDialog}
                voteType={session.type === "poll" ? "poll" : "elections"}
                voteMode={
                  session.subtype === "multiple"
                      ? "multiple"
                      : session.subtype === "ranked"
                          ? "ranked"
                          : "single"
                }
                kyc={session.verificationMethod === "KYC"}
                maxSelections={session.subtype === "multiple" ? 3 : 1}
                options={session.type === "poll" ? getPollOptions() : undefined}
                candidates={session.type !== "poll" ? getElectionCandidates() : undefined}
                onSubmit={handleVoteSubmit}
            />
        )}

        <Dialog open={showBlockchainDialog} onOpenChange={setShowBlockchainDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Your Vote</DialogTitle>
              <DialogDescription>
                You are about to cast your vote on the blockchain. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4">
                  <p className="text-sm">Connected wallet address:</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded-md mt-1 break-all">
                    {walletAddress || "Not connected"}
                  </p>
                </div>
              </div>
              
              <div className="col-span-4">
                <p className="text-sm">Session:</p>
                <p className="text-sm font-medium">{session.name}</p>
                {session.contractAddress && (
                  <>
                    <p className="text-sm mt-2">Contract address:</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded-md mt-1 break-all">
                      {session.contractAddress}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBlockchainDialog(false)} disabled={isBlockchainLoading}>
                Cancel
              </Button>
              <Button onClick={confirmBlockchainVote} disabled={isBlockchainLoading}>
                {isBlockchainLoading ? "Processing..." : "Confirm Vote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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
                  {session.contractAddress && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
                      <BlocksIcon className="h-4 w-4 text-indigo-500" />
                      <span>Results verified on blockchain</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto h-7 text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
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
                      <a 
                        href={`https://sepolia.etherscan.io/address/${session.contractAddress}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Contract
                      </a>
                    </div>
                  )}
                
                  {session.type === "poll" ? (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 bg-muted px-4 py-2 text-sm font-medium">
                        <div className="col-span-7">Option</div>
                        <div className="col-span-3 text-right">Votes</div>
                        <div className="col-span-2 text-right">Percentage</div>
                      </div>
                      <div className="divide-y">
                        {session.options && session.options.map((option: any) => {
                          const voteCount = option.voteCount || option.totalVotes || 0;
                          const totalVotes = session.options.reduce((sum: number, opt: any) => 
                            sum + (opt.voteCount || opt.totalVotes || 0), 0);
                          const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <div key={option._id} className="grid grid-cols-12 px-4 py-3 text-sm">
                              <div className="col-span-7 font-medium flex items-center">
                                {option.name}
                                {option.blockchainVerified && (
                                  <BadgeCheck className="h-4 w-4 ml-1 text-green-500" aria-label="Verified on blockchain" />
                                )}
                              </div>
                              <div className="col-span-3 text-right">{voteCount}</div>
                              <div className="col-span-2 text-right">{percentage}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 bg-muted px-4 py-2 text-sm font-medium">
                        <div className="col-span-7">Candidate</div>
                        <div className="col-span-3 text-right">Votes</div>
                        <div className="col-span-2 text-right">Percentage</div>
                      </div>
                      <div className="divide-y">
                        {session.candidates && session.candidates.map((candidate: any) => {
                          const voteCount = candidate.voteCount || candidate.totalVotes || 0;
                          const totalVotes = session.candidates.reduce((sum: number, cand: any) => 
                            sum + (cand.voteCount || cand.totalVotes || 0), 0);
                          const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <div key={candidate._id} className="grid grid-cols-12 px-4 py-3 text-sm">
                              <div className="col-span-7 font-medium flex items-center">
                                {candidate.fullName || candidate.partyName}
                                {candidate.blockchainVerified && (
                                  <BadgeCheck className="h-4 w-4 ml-1 text-green-500" aria-label="Verified on blockchain" />
                                )}
                              </div>
                              <div className="col-span-3 text-right">{voteCount}</div>
                              <div className="col-span-2 text-right">{percentage}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
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
