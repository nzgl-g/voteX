"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Clock, Users, Eye, Vote, BarChart3 } from "lucide-react";
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
import { VotingDialog, VotingOption, Candidate as VotingCandidate } from "./vote-cast/voting-dialog";

export const getSessionLifecycleStatus = (session: any): SessionLifecycleStatus => {
  // Defensive check for session data
  if (!session || !session.sessionLifecycle) {
    console.error("Invalid session data for lifecycle status", session);
    return {
      status: "unknown",
      label: "Unknown",
      color: "bg-muted hover:bg-muted/90 text-muted-foreground"
    };
  }

  try {
    const now = new Date();
    const scheduledStart = session.sessionLifecycle.scheduledAt?.start ? new Date(session.sessionLifecycle.scheduledAt.start) : null;
    const scheduledEnd = session.sessionLifecycle.scheduledAt?.end ? new Date(session.sessionLifecycle.scheduledAt.end) : null;
    const startedAt = session.sessionLifecycle.startedAt ? new Date(session.sessionLifecycle.startedAt) : null;
    const endedAt = session.sessionLifecycle.endedAt ? new Date(session.sessionLifecycle.endedAt) : null;

    // Ended if current time is after end date
    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-destructive/50 hover:bg-destructive/60 text-destructive-foreground"
      };
    }

    // Started if current time is between start date and end date
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "started",
        label: "Active",
        color: "bg-primary hover:bg-primary/90 text-primary-foreground"
      };
    }

    // Nomination if the scheduled time is defined and current time is between the scheduled start and end
    if (scheduledStart && scheduledEnd && now >= scheduledStart && now <= scheduledEnd) {
      return {
        status: "nomination",
        label: "Nominations",
        color: "bg-vote-nominations hover:bg-vote-nominations/90 text-primary-foreground"
      };
    }

    // Upcoming if there is no nomination and the start date isn't arrived
    // or there is a nomination but scheduling start isn't arrived
    if ((startedAt && now < startedAt) || (scheduledStart && now < scheduledStart)) {
      return {
        status: "upcoming",
        label: "Coming Soon",
        color: "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      };
    }

    return {
      status: "unknown",
      label: "Not Scheduled",
      color: "bg-muted hover:bg-muted/90 text-muted-foreground"
    };
  } catch (error) {
    console.error("Error determining session lifecycle status:", error);
    return {
      status: "unknown",
      label: "Error",
      color: "bg-destructive/50 hover:bg-destructive/60 text-destructive-foreground"
    };
  }
};

// Helper function to safely format dates
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
  session, 
  onJoinAsCandidate, 
  onCastVote, 
  onShowResults, 
  onViewProfile 
}: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  
  // Defensive check for session data
  if (!session || typeof session !== 'object' || !session._id) {
    console.error("Invalid session data provided to SessionCard:", session);
    return null;
  }
  
  const lifecycleStatus = getSessionLifecycleStatus(session);

  // Prepare options for voting dialog
  const getPollOptions = (): VotingOption[] => {
    try {
      return (session.options || []).map((opt: any) => ({
        id: opt._id || opt.id || String(Math.random()),
        title: opt.name || "Unnamed Option",
        description: opt.description || "No description provided"
      }));
    } catch (error) {
      console.error("Error preparing poll options:", error);
      return [];
    }
  };
  
  // Prepare candidates for voting dialog
  const getElectionCandidates = (): VotingCandidate[] => {
    try {
      return (session.candidates || []).map((candidate: any) => ({
        id: candidate._id || candidate.id || String(Math.random()),
        title: candidate.fullName || "Unknown Candidate",
        biography: candidate.partyName || "No biography available"
      }));
    } catch (error) {
      console.error("Error preparing election candidates:", error);
      return [];
    }
  };
      
  // Handle voting submission
  const handleVoteSubmit = async (data: any) => {
    console.log("Vote submitted:", data);
    try {
      // Here we would normally send the vote to the backend
      // For now, just notify the parent component
      onCastVote(session);
      // Close the dialog
      setShowVotingDialog(false);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const getContextualButton = () => {
    switch (lifecycleStatus.status) {
      case "nomination":
        return (
          <Button 
            className="w-full bg-vote-nominations hover:bg-vote-nominations/90 text-primary-foreground"
            onClick={() => onJoinAsCandidate(session)}
          >
            Join as Candidate
          </Button>
        );
      case "started":
        return (
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => setShowVotingDialog(true)}
          >
            <Vote className="h-4 w-4 mr-2" />
            Cast Your Vote
          </Button>
        );
      case "ended":
        return (
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => onShowResults(session)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Show Results
          </Button>
        );
      case "upcoming":
      default:
        return (
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => onViewProfile(session)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        );
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden transition-all duration-300 hover:shadow-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Banner with badges */}
        <div className="relative h-40">
          {session.banner ? (
            <Image
              src={session.banner}
              alt={session.name || "Session"}
              fill
              className="object-cover"
            />
          ) : (
            <Image
              src="/placeholder.svg"
              alt="Session placeholder"
              fill
              className="object-cover"
            />
          )}
          
          {/* View Profile Button (appears on hover) */}
          {isHovered && (
            <div className="absolute top-2 right-2 transition-opacity duration-200">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => onViewProfile(session)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          )}
          
          {/* Session Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge className="capitalize">
              {session.type || "Unknown"}
            </Badge>
          </div>
          
          {/* Lifecycle Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className={`${lifecycleStatus.color}`}>
              {lifecycleStatus.label}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1">{session.name || "Unnamed Session"}</CardTitle>
          {session.description && (
            <CardDescription className="line-clamp-2">
              {session.description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="flex flex-col gap-2 text-sm">
            {/* Organization Name */}
            {session.organizationName && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{session.organizationName}</span>
              </div>
            )}
            
            {/* Scheduled Dates - Nominations */}
            {session.sessionLifecycle?.scheduledAt?.start && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Nominations: {formatDate(session.sessionLifecycle.scheduledAt.start)}
                  {session.sessionLifecycle.scheduledAt.end && 
                    ` - ${formatDate(session.sessionLifecycle.scheduledAt.end)}`}
                </span>
              </div>
            )}
            
            {/* Voting Period */}
            {session.sessionLifecycle?.startedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Voting: {formatDate(session.sessionLifecycle.startedAt)}
                  {session.sessionLifecycle?.endedAt && 
                    ` - ${formatDate(session.sessionLifecycle.endedAt)}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-4">
          {getContextualButton()}
        </CardFooter>
      </Card>

      {/* Voting Dialog */}
      {showVotingDialog && (
        <VotingDialog
          open={showVotingDialog}
          onOpenChange={setShowVotingDialog}
          voteType={session.type === "poll" ? "poll" : "elections"}
          voteMode={session.subtype === "multiple" 
            ? "multiple" 
            : session.subtype === "ranked" 
              ? "ranked" 
              : "single"}
          kyc={session.verificationMethod === "KYC"}
          maxSelections={session.subtype === "multiple" ? 3 : 1}
          options={session.type === "poll" ? getPollOptions() : undefined}
          candidates={session.type !== "poll" ? getElectionCandidates() : undefined}
          onSubmit={handleVoteSubmit}
        />
      )}
    </>
  );
} 