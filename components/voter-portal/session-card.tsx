"use client";

import { useState } from "react";
import Image from "next/image";
import {Calendar, Clock, Users, Eye, Vote, BarChart3, UserPlus} from "lucide-react";
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
        color: "bg-zinc-800 text-zinc-200 border border-zinc-700",
      };
    }

    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "started",
        label: "Active",
        color: "bg-emerald-600 text-white border border-emerald-700",
      };
    }

    if (
        scheduledStart &&
        scheduledEnd &&
        now >= scheduledStart &&
        now <= scheduledEnd
    ) {
      return {
        status: "nomination",
        label: "Nominations",
        color: "bg-amber-500 text-black dark:text-zinc-900 border border-amber-600",
      };
    }

    if (
        (startedAt && now < startedAt) ||
        (scheduledStart && now < scheduledStart)
    ) {
      return {
        status: "upcoming",
        label: "Coming Soon",
        color: "bg-blue-500 text-white border border-blue-600",
      };
    }

    return {
      status: "unknown",
      label: "Not Scheduled",
      color: "bg-neutral-700 text-neutral-300 border border-neutral-600",
    };
  } catch (error) {
    console.error("Error determining session lifecycle status:", error);
    return {
      status: "error",
      label: "Error",
      color: "bg-red-600 text-white border border-red-700",
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
                              session,
                              onJoinAsCandidate,
                              onCastVote,
                              onShowResults,
                              onViewProfile,
                            }: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);

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
      }));
    } catch (error) {
      console.error("Error preparing election candidates:", error);
      return [];
    }
  };

  const handleVoteSubmit = async (data: any) => {
    console.log("Vote submitted:", data);
    try {
      onCastVote(session);
      setShowVotingDialog(false);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const getContextualButton = () => {
    const buttonBaseClasses = "w-full transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const getVariantClasses = (variant: string) => {
      const base = "flex items-center justify-center font-medium rounded-lg px-4 py-3 shadow-sm";
      switch(variant) {
        case "default":
          return `${base} bg-primary hover:bg-primary-dark text-white focus:ring-primary-light`;
        case "outline":
          return `${base} border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary-light`;
        default:
          return base;
      }
    };

    const iconAnimation = "transition-transform duration-300 group-hover:scale-110";

    switch (lifecycleStatus.status) {
      case "nomination":
        return (
            <Button
                className={`${buttonBaseClasses} ${getVariantClasses("default")} group`}
                onClick={() => onJoinAsCandidate(session)}
            >
              <UserPlus className={`h-5 w-5 mr-2 ${iconAnimation}`} />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
            Join as Candidate
          </span>
            </Button>
        );
      case "started":
        return (
            <Button
                className={`${buttonBaseClasses} ${getVariantClasses("default")} group`}
                onClick={() => setShowVotingDialog(true)}
            >
              <Vote className={`h-5 w-5 mr-2 ${iconAnimation}`} />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
            Cast Your Vote
          </span>
            </Button>
        );
      case "ended":
        return (
            <Button
                className={`${buttonBaseClasses} ${getVariantClasses("outline")} group`}
                onClick={() => onShowResults(session)}
            >
              <BarChart3 className={`h-5 w-5 mr-2 ${iconAnimation}`} />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
            Show Results
          </span>
            </Button>
        );
      case "upcoming":
      default:
        return (
            <Button
                className={`${buttonBaseClasses} ${getVariantClasses("outline")} group`}
                onClick={() => onViewProfile(session)}
            >
              <Eye className={`h-5 w-5 mr-2 ${iconAnimation}`} />
              <span className="group-hover:translate-x-1 transition-transform duration-300">
            View Profile
          </span>
            </Button>
        );
    }
  };

  return (
      <>
        <Card
            className="group relative overflow-hidden rounded-2xl border bg-background/50 shadow-sm transition-shadow hover:shadow-md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative h-40 w-full overflow-hidden">
            <Image
                src={session.banner || "/placeholder.svg"}
                alt={session.name || "Session"}
                fill
                className="object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge className="capitalize px-3 py-1 text-xs font-medium bg-blue-600 text-white dark:bg-blue-400 dark:text-black">
                {session.type || "Unknown"}
              </Badge>

            </div>
            <div className="absolute bottom-3 right-3">
              <Badge variant="outline" className={`${lifecycleStatus.color} px-3 py-1 text-xs font-medium`}>
                {lifecycleStatus.label}
              </Badge>
            </div>
          </div>

          <div className="px-5 pb-3 pt-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-semibold leading-snug">
                {session.name || "Unnamed Session"}
              </CardTitle>
              {session.description && (
                  <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {session.description}
                  </CardDescription>
              )}
            </CardHeader>

            <CardContent className="mt-4 grid gap-2 text-sm">
              {session.organizationName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.organizationName}</span>
                  </div>
              )}
              {session.sessionLifecycle?.scheduledAt?.start && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                  Nominations: {formatDate(session.sessionLifecycle.scheduledAt.start)}
                      {session.sessionLifecycle.scheduledAt.end &&
                          ` - ${formatDate(session.sessionLifecycle.scheduledAt.end)}`}
                </span>
                  </div>
              )}
              {session.sessionLifecycle?.startedAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                  Voting: {formatDate(session.sessionLifecycle.startedAt)}
                      {session.sessionLifecycle?.endedAt &&
                          ` - ${formatDate(session.sessionLifecycle.endedAt)}`}
                </span>
                  </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="mt-auto border-t bg-background/80 px-5 py-4">
            {getContextualButton()}
          </CardFooter>
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
      </>
  );
}
