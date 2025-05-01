"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { SessionBanner } from "./session-banner"
import { SessionMetadata } from "./session-metadata"
import { SessionSettings } from "./session-settings"
import { PollOptions } from "./poll-options"
import { CandidateTable } from "./candidate-table"
import { SessionActions } from "./session-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "@/hooks/use-toast"
import { sessionService, Session } from "@/api/session-service"
import { Skeleton } from "@/components/shadcn-ui/skeleton"

export type SessionType = "Poll" | "Election" | "Tournament"
export type VotingMode = "Single Choice" | "Multiple Choice" | "Ranked Choice"
export type ResultVisibility = "Public" | "Private"
export type VerificationMethod = "Standard" | "KYC" | "CVC"
export type AccessLevel = "Public" | "Private"
export type CandidateStatus = "Accepted" | "Pending" | "Refused"

export interface SessionData {
  id: string
  title: string
  description: string
  organizationName: string
  sessionType: SessionType
  votingMode: VotingMode
  nominationStart: string
  nominationEnd: string
  votingStart: string
  votingEnd: string
  creationDate: string
  resultVisibility: ResultVisibility
  verificationMethod: VerificationMethod
  accessLevel: AccessLevel
  secretPhrase: string
  csvEmailFiltering: boolean
  pollOptions: { id: string; name: string }[]
  candidates: {
    id: string
    fullName: string
    email: string
    status: CandidateStatus
  }[]
}

// Helper function to map backend session to frontend SessionData format
const mapSessionToSessionData = (session: Session): SessionData => {
  // Map session type
  const sessionType: SessionType = 
    session.type === "election" ? "Election" :
    session.type === "poll" ? "Poll" :
    session.type === "tournament" ? "Tournament" : "Poll";

  // Map voting mode
  const votingMode: VotingMode = 
    session.subtype === "single" ? "Single Choice" :
    session.subtype === "multiple" ? "Multiple Choice" :
    session.subtype === "ranked" ? "Ranked Choice" : "Single Choice";

  // Map verification method
  const verificationMethod: VerificationMethod = 
    session.verificationMethod === "KYC" ? "KYC" :
    session.verificationMethod === "CVC" ? "CVC" : "Standard";

  // Extract dates from sessionLifecycle
  const now = new Date().toISOString();
  const creationDate = session.sessionLifecycle?.createdAt || now;
  const nominationStart = session.sessionLifecycle?.scheduledAt?.start || now;
  const nominationEnd = session.sessionLifecycle?.scheduledAt?.end || now;
  const votingStart = session.sessionLifecycle?.startedAt || now;
  const votingEnd = session.sessionLifecycle?.endedAt || now;

  // Map poll options or candidates
  const pollOptions = session.options ? 
    session.options.map(option => ({
      id: option.name, // Using name as ID since we don't have IDs in the backend model
      name: option.name
    })) : [];

  // Map candidates (simplified for now)
  const candidates = session.candidates ? 
    session.candidates.map(candidate => ({
      id: candidate.user, // Using user ID as candidate ID
      fullName: candidate.partyName, // Using partyName as fullName for now
      email: "", // Email not available in the backend model
      status: candidate.status as CandidateStatus
    })) : [];

  return {
    id: session._id,
    title: session.name,
    description: session.description || "",
    organizationName: session.organizationName || "",
    sessionType,
    votingMode,
    nominationStart,
    nominationEnd,
    votingStart,
    votingEnd,
    creationDate,
    resultVisibility: session.accessLevel as ResultVisibility,
    verificationMethod,
    accessLevel: session.accessLevel as AccessLevel,
    secretPhrase: session.secretPhrase || "",
    csvEmailFiltering: false, // Not available in backend model
    pollOptions,
    candidates
  };
};

// Helper function to map frontend updates to backend format
const mapSessionDataToBackendUpdates = (sessionData: Partial<SessionData>) => {
  const updates: any = {};
  
  if (sessionData.title) updates.name = sessionData.title;
  if (sessionData.description !== undefined) updates.description = sessionData.description;
  if (sessionData.organizationName !== undefined) updates.organizationName = sessionData.organizationName;
  
  // Map dates if provided
  if (sessionData.nominationStart || sessionData.nominationEnd) {
    updates.sessionLifecycle = { scheduledAt: {} };
    if (sessionData.nominationStart) {
      updates.sessionLifecycle.scheduledAt.start = sessionData.nominationStart;
    }
    if (sessionData.nominationEnd) {
      updates.sessionLifecycle.scheduledAt.end = sessionData.nominationEnd;
    }
  }
  
  // Map other fields as needed
  if (sessionData.accessLevel) updates.accessLevel = sessionData.accessLevel;
  if (sessionData.secretPhrase) updates.secretPhrase = sessionData.secretPhrase;
  if (sessionData.verificationMethod) {
    updates.verificationMethod = sessionData.verificationMethod === "Standard" ? null : sessionData.verificationMethod;
  }
  
  return updates;
};

export function VoteSessionManagement() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data from backend
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const session = await sessionService.getSessionById(sessionId);
        const mappedSession = mapSessionToSessionData(session as Session);
        setSessionData(mappedSession);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch session:", err);
        setError(err.message || "Failed to fetch session data");
        toast({
          title: "Error",
          description: "Failed to load session data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  // Handle session updates
  const handleUpdateSession = async (updatedData: Partial<SessionData>) => {
    if (!sessionData) return;
    
    try {
      // Optimistically update UI
      setSessionData(prev => prev ? { ...prev, ...updatedData } : null);
      
      // Map frontend updates to backend format
      const backendUpdates = mapSessionDataToBackendUpdates(updatedData);
      
      // Call backend API to update session (commented out as the PATCH endpoint is not ready yet)
      // await sessionService.updateSession(sessionData.id, backendUpdates);
      
      toast({
        title: "Changes saved",
        description: "Session has been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update session:", err);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive"
      });
      
      // Revert optimistic update on error
      const session = await sessionService.getSessionById(sessionId);
      const mappedSession = mapSessionToSessionData(session as Session);
      setSessionData(mappedSession);
    }
  };

  // Check if nomination is active
  const isNominationActive = () => {
    if (!sessionData) return false;
    
    const now = new Date();
    const nominationStart = new Date(sessionData.nominationStart);
    const nominationEnd = new Date(sessionData.nominationEnd);
    return now >= nominationStart && now <= nominationEnd;
  };

  // Handle session actions
  const handleStartSession = async () => {
    if (!sessionData) return;
    
    try {
      // Call backend API to start session
      // This would be implemented when the backend supports it
      // await sessionService.startSession(sessionData.id);
      
      toast({
        title: "Session started",
        description: `Your ${sessionData.sessionType.toLowerCase()} session has been started successfully.`,
      });
    } catch (err: any) {
      console.error("Failed to start session:", err);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStopSession = async () => {
    if (!sessionData) return;
    
    try {
      // Call backend API to stop session
      // This would be implemented when the backend supports it
      // await sessionService.stopSession(sessionData.id);
      
      toast({
        title: "Session stopped",
        description: `Your ${sessionData.sessionType.toLowerCase()} session has been stopped.`,
      });
    } catch (err: any) {
      console.error("Failed to stop session:", err);
      toast({
        title: "Error",
        description: "Failed to stop session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionData) return;
    
    try {
      // Get available sessions before deleting the current one
      const [mySessions, memberSessions] = await Promise.all([
        sessionService.getUserSessions(),
        sessionService.getUserSessionsAsMember()
      ]);
      
      // Combine all sessions
      const allSessions = [
        ...mySessions,
        ...(memberSessions.sessions || [])
      ];
      
      // Filter out the current session
      const otherSessions = allSessions.filter(session => session._id !== sessionData.id);
      
      // Delete the current session
      await sessionService.deleteSession(sessionData.id);
      
      toast({
        title: "Session deleted",
        description: `Your ${sessionData.sessionType.toLowerCase()} session has been deleted.`,
      });
      
      // Redirect logic
      if (otherSessions.length > 0) {
        // Get the first available session
        const nextSession = otherSessions[0];
        
        // Determine the role based on the session creator
        const isLeader = nextSession.createdBy?._id === sessionService.getCurrentUserId();
        const roleSegment = isLeader ? 'team-leader' : 'team-member';
        
        // Navigate to the next available session
        router.push(`/${roleSegment}/monitoring/${nextSession._id}`);
      } else {
        // If no other sessions available, go to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Failed to delete session:", err);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 container mx-auto py-6 px-4 md:px-6 pb-24">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full mt-6 rounded-xl" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-2">Error Loading Session</h2>
          <p className="text-muted-foreground mb-4">{error || "Session not found"}</p>
          <Button onClick={() => router.push("/dashboard/sessions")} variant="default">
            Return to Sessions
          </Button>
        </div>
      </div>
    );
  }

  // Show session data
  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <div className="flex-1 container mx-auto py-6 px-4 md:px-6 pb-24">
        <SessionBanner sessionId={sessionData.id} />

        {isMobile ? (
          <Tabs defaultValue="metadata" className="w-full mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="metadata">Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="metadata">
              <SessionMetadata sessionData={sessionData} onUpdate={handleUpdateSession} />
            </TabsContent>
            <TabsContent value="settings">
              <SessionSettings sessionData={sessionData} onUpdate={handleUpdateSession} />
            </TabsContent>
            <TabsContent value="content">
              {sessionData.sessionType === "Poll" ? (
                <PollOptions
                  options={sessionData.pollOptions}
                  onUpdate={(options) => handleUpdateSession({ pollOptions: options })}
                />
              ) : (
                <CandidateTable
                  candidates={sessionData.candidates}
                  onUpdate={(candidates) => handleUpdateSession({ candidates })}
                  isNominationActive={isNominationActive()}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <SessionMetadata sessionData={sessionData} onUpdate={handleUpdateSession} />
              <SessionSettings sessionData={sessionData} onUpdate={handleUpdateSession} />
            </div>
            <div className="mt-6">
              {sessionData.sessionType === "Poll" ? (
                <PollOptions
                  options={sessionData.pollOptions}
                  onUpdate={(options) => handleUpdateSession({ pollOptions: options })}
                />
              ) : (
                <CandidateTable
                  candidates={sessionData.candidates}
                  onUpdate={(candidates) => handleUpdateSession({ candidates })}
                  isNominationActive={isNominationActive()}
                />
              )}
            </div>
          </>
        )}

        <SessionActions
          sessionType={sessionData.sessionType}
          onStartSession={handleStartSession}
          onStopSession={handleStopSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  )
}

// Add Button import for error state
import { Button } from "@/components/shadcn-ui/button"
