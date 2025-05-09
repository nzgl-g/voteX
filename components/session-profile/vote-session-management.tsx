"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { SessionBanner } from "./session-banner"
import { SessionMetadata } from "./session-metadata"
import { SessionSettings } from "./session-settings"
import { PollOptions } from "./poll-options"
import { CandidateTable } from "./candidate-table"
import { SessionActions } from "./session-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "@/hooks/use-toast"
import { sessionService, Session } from "@/api/session-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Edit, Save, X } from "lucide-react"

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
  subscription?: {
    name?: string
    price?: number
    voterLimit?: number | null
    features?: string[]
  }
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
  
  // Properly handle nomination period dates with better null/undefined checks
  const hasScheduledNomination = session.sessionLifecycle?.scheduledAt && 
                               (session.sessionLifecycle.scheduledAt.start || session.sessionLifecycle.scheduledAt.end);
                               
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
    candidates,
    subscription: session.subscription ? {
      name: session.subscription.name,
      price: session.subscription.price,
      voterLimit: session.subscription.voterLimit,
      features: session.subscription.features || []
    } : undefined
  };
};

// Helper function to map frontend updates to backend format
const mapSessionDataToBackendUpdates = (sessionData: Partial<SessionData>) => {
  const updates: any = {};
  
  // Map basic session fields
  if (sessionData.title !== undefined) updates.name = sessionData.title;
  if (sessionData.description !== undefined) updates.description = sessionData.description;
  if (sessionData.organizationName !== undefined) updates.organizationName = sessionData.organizationName;
  
  // Initialize sessionLifecycle if needed
  if (!updates.sessionLifecycle && (
    sessionData.nominationStart !== undefined || 
    sessionData.nominationEnd !== undefined ||
    sessionData.votingStart !== undefined ||
    sessionData.votingEnd !== undefined
  )) {
    updates.sessionLifecycle = {};
  }
  
  // Handle scheduledAt (nomination dates)
  if (sessionData.nominationStart !== undefined || sessionData.nominationEnd !== undefined) {
    if (!updates.sessionLifecycle) updates.sessionLifecycle = {};
    updates.sessionLifecycle.scheduledAt = updates.sessionLifecycle.scheduledAt || {};
    
    if (sessionData.nominationStart !== undefined) {
      updates.sessionLifecycle.scheduledAt.start = sessionData.nominationStart;
    }
    
    if (sessionData.nominationEnd !== undefined) {
      updates.sessionLifecycle.scheduledAt.end = sessionData.nominationEnd;
    }
  }
  
  // Handle voting dates
  if (sessionData.votingStart !== undefined) {
    if (!updates.sessionLifecycle) updates.sessionLifecycle = {};
    updates.sessionLifecycle.startedAt = sessionData.votingStart;
  }
  
  if (sessionData.votingEnd !== undefined) {
    if (!updates.sessionLifecycle) updates.sessionLifecycle = {};
    updates.sessionLifecycle.endedAt = sessionData.votingEnd;
  }
  
  // Map session type and voting mode if changed
  if (sessionData.sessionType !== undefined) {
    updates.type = sessionData.sessionType.toLowerCase();
  }
  
  if (sessionData.votingMode !== undefined) {
    updates.subtype = sessionData.votingMode === "Single Choice" ? "single" :
                     sessionData.votingMode === "Multiple Choice" ? "multiple" : "ranked";
  }
  
  // Map security settings
  if (sessionData.accessLevel !== undefined) {
    updates.accessLevel = sessionData.accessLevel;
  }
  
  if (sessionData.secretPhrase !== undefined) {
    updates.secretPhrase = sessionData.secretPhrase;
    if (sessionData.secretPhrase && sessionData.accessLevel === "Private") {
      updates.securityMethod = "Secret Phrase";
    }
  }
  
  if (sessionData.verificationMethod !== undefined) {
    updates.verificationMethod = sessionData.verificationMethod === "Standard" ? null : sessionData.verificationMethod;
  }
  
  // Map poll options if present
  if (sessionData.pollOptions !== undefined && Array.isArray(sessionData.pollOptions)) {
    updates.options = sessionData.pollOptions.map(option => ({
      name: option.name,
      description: null
    }));
  }
  
  // Map candidates if present
  if (sessionData.candidates !== undefined && Array.isArray(sessionData.candidates)) {
    // Only include valid candidate data
    updates.candidates = sessionData.candidates
      .filter(candidate => candidate && candidate.id && candidate.fullName)
      .map(candidate => ({
        user: candidate.id,
        status: candidate.status,
        partyName: candidate.fullName
      }));
  }
  
  // Validate sessionLifecycle object
  if (updates.sessionLifecycle) {
    // Ensure proper date format for all date fields
    if (updates.sessionLifecycle.scheduledAt) {
      if (updates.sessionLifecycle.scheduledAt.start) {
        const startDate = new Date(updates.sessionLifecycle.scheduledAt.start);
        if (!isNaN(startDate.getTime())) {
          updates.sessionLifecycle.scheduledAt.start = startDate.toISOString();
        } else {
          delete updates.sessionLifecycle.scheduledAt.start;
        }
      }
      
      if (updates.sessionLifecycle.scheduledAt.end) {
        const endDate = new Date(updates.sessionLifecycle.scheduledAt.end);
        if (!isNaN(endDate.getTime())) {
          updates.sessionLifecycle.scheduledAt.end = endDate.toISOString();
        } else {
          delete updates.sessionLifecycle.scheduledAt.end;
        }
      }
    }
    
    if (updates.sessionLifecycle.startedAt) {
      const startDate = new Date(updates.sessionLifecycle.startedAt);
      if (!isNaN(startDate.getTime())) {
        updates.sessionLifecycle.startedAt = startDate.toISOString();
      } else {
        delete updates.sessionLifecycle.startedAt;
      }
    }
    
    if (updates.sessionLifecycle.endedAt) {
      const endDate = new Date(updates.sessionLifecycle.endedAt);
      if (!isNaN(endDate.getTime())) {
        updates.sessionLifecycle.endedAt = endDate.toISOString();
      } else {
        delete updates.sessionLifecycle.endedAt;
      }
    }
  }
  
  console.log("Mapped session data for API:", updates);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SessionData>>({});

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
        setEditData(mappedSession);
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

  // Helper to check if session is active (voting has started)
  const isSessionActive = () => {
    if (!sessionData) return false;
    
    const now = new Date();
    const votingStart = new Date(sessionData.votingStart);
    return now >= votingStart;
  };

  // Check if session has PRO features
  const hasProFeatures = () => {
    if (!sessionData) return false;
    
    // Check if session type is not Poll (Election and Tournament are Pro features)
    // or if the subscription name explicitly has "pro" in it
    return sessionData.sessionType !== "Poll" || 
           sessionData.subscription?.name?.toLowerCase() === "pro" ||
           sessionData.subscription?.name?.toLowerCase() === "enterprise";
  };

  // Handle field changes during editing
  const handleFieldChange = (field: keyof SessionData, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Handle cancelling edits
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (sessionData) {
      setEditData(sessionData);
    }
  };

  // Handle saving all edits
  const handleSaveEdit = async () => {
    if (!sessionData) return;
    
    try {
      // Prepare data for update
      const updateData = { ...editData };
      
      // Check if nomination dates are valid
      const hasValidNomination = updateData.nominationStart && 
                               updateData.nominationEnd && 
                               new Date(updateData.nominationStart) < new Date(updateData.nominationEnd);
                               
      if (!hasValidNomination) {
        updateData.nominationStart = undefined;
        updateData.nominationEnd = undefined;
      }
      
      // When session is active, only restrict specific fields
      // Title, description, and other fields should always be editable
      if (isSessionActive()) {
        // Remove only fields that can't be changed after session starts
        delete updateData.votingStart; // Can't change start date
        delete updateData.candidates;   // Can't change candidates
        delete updateData.pollOptions;  // Can't change poll options
      }
      
      // Show loading toast
      toast({
        title: "Saving changes...",
        description: "Please wait while we save your changes.",
      });
      
      // Ensure we're only sending fields that have actually changed
      const originalData = { ...sessionData };
      const changedFields = Object.keys(updateData).filter(key => {
        const typedKey = key as keyof SessionData;
        if (typedKey === 'candidates' || typedKey === 'pollOptions') {
          return JSON.stringify(updateData[typedKey]) !== JSON.stringify(originalData[typedKey]);
        }
        return updateData[typedKey] !== originalData[typedKey];
      });
      
      // Create a clean update object with only changed fields
      const cleanUpdateData: Partial<SessionData> = {};
      changedFields.forEach(key => {
        const typedKey = key as keyof SessionData;
        cleanUpdateData[typedKey] = updateData[typedKey] as any;
      });
      
      // Don't send empty update
      if (Object.keys(cleanUpdateData).length === 0) {
        toast({
          title: "No changes detected",
          description: "No changes were made to save.",
        });
        setIsEditing(false);
        return;
      }
      
      console.log('Sending update with clean data:', cleanUpdateData);
      
      // Map frontend updates to backend format
      const backendUpdates = mapSessionDataToBackendUpdates(cleanUpdateData);
      
      // Call backend API to update session
      const updatedSession = await sessionService.updateSession(sessionData.id, backendUpdates);
      
      // Map the updated session back to our format
      const mappedSession = mapSessionToSessionData(updatedSession as Session);
      
      // Update UI after successful save
      setSessionData(mappedSession);
      setEditData(mappedSession);
      
      // Exit edit mode
      setIsEditing(false);
      
      toast({
        title: "Changes saved",
        description: "All session changes have been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update session:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update a part of the session (used by child components)
  const handleUpdateSession = (updatedData: Partial<SessionData>) => {
    if (!isEditing || !sessionData) return;
    
    // Only update if something actually changed to prevent unnecessary re-renders
    let hasChanges = false;
    
    // Check if any values have changed before updating state
    Object.keys(updatedData).forEach(key => {
      const typedKey = key as keyof SessionData;
      // Use deep comparison for arrays like candidates and pollOptions
      if (typedKey === 'candidates' || typedKey === 'pollOptions') {
        if (JSON.stringify(updatedData[typedKey]) !== JSON.stringify(editData[typedKey])) {
          hasChanges = true;
        }
      } else if (updatedData[typedKey] !== editData[typedKey]) {
        hasChanges = true;
      }
    });
    
    // Only update state if something actually changed
    if (hasChanges) {
      // Use functional state update to ensure latest state
      setEditData(prev => {
        const newState = { ...prev, ...updatedData };
        console.log('Updated edit data', newState);
        return newState;
      });
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
      // Delete the current session
      await sessionService.deleteSession(sessionData.id);
      
      toast({
        title: "Session deleted",
        description: `Your ${sessionData.sessionType.toLowerCase()} session has been deleted.`,
      });
      
      // After deletion, check if user has any other sessions
      try {
        // Get all sessions (both as leader and member)
        const [mySessions, memberSessions] = await Promise.all([
          sessionService.getUserSessions(),
          sessionService.getUserSessionsAsMember()
        ]);
        
        // Get all sessions
        const allSessions = [
          ...(mySessions || []),
          ...(memberSessions?.sessions || [])
        ];
        
        // Navigate based on available sessions
        if (allSessions.length > 0) {
          // If there are other sessions, navigate to the first one
          const nextSession = allSessions[0];
          
          // Determine if user is leader or member
          const isLeader = nextSession.createdBy?._id === sessionService.getCurrentUserId();
          const role = isLeader ? 'team-leader' : 'team-member';
          
          // Navigate to the next session
          router.push(`/${role}/monitoring/${nextSession._id}`);
        } else {
          // If no other sessions, go to voter page
          router.push('/voter');
        }
      } catch (error) {
        console.error("Error checking for other sessions:", error);
        // Default fallback - go to voter page
        router.push('/voter');
      }
    } catch (err: any) {
      console.error("Failed to delete session:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete session. Please try again.",
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Session Management</h1>
          {/* Edit button should always be visible */}
          {sessionData && (
            isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Session
              </Button>
            )
          )}
        </div>

        {isSessionActive() && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md p-3 mb-4 text-yellow-800 dark:text-yellow-400">
            <p className="text-sm">
              <strong>Note:</strong> When a session is active, you can still edit most fields including title and description, but candidates/options and start date cannot be modified.
            </p>
          </div>
        )}
        
        <SessionBanner sessionId={sessionData?.id || ""} />

        {isMobile ? (
          <Tabs defaultValue="metadata" className="w-full mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="metadata">Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="metadata">
              <SessionMetadata 
                sessionData={sessionData as SessionData} 
                editData={editData as SessionData}
                isEditing={isEditing}
                isActive={isSessionActive()}
                onUpdate={handleUpdateSession}
                onChange={handleFieldChange}
              />
            </TabsContent>
            <TabsContent value="settings">
              <SessionSettings 
                sessionData={sessionData as SessionData} 
                editData={editData as SessionData}
                isEditing={isEditing}
                isActive={isSessionActive()}
                onUpdate={handleUpdateSession}
                onChange={handleFieldChange}
                hasProFeatures={hasProFeatures()}
              />
            </TabsContent>
            <TabsContent value="content">
              {sessionData?.sessionType === "Poll" ? (
                <PollOptions
                  options={sessionData.pollOptions}
                  isEditing={isEditing && !isSessionActive()}
                  onUpdate={(options) => handleUpdateSession({ pollOptions: options })}
                />
              ) : (
                <CandidateTable
                  candidates={sessionData?.candidates || []}
                  isEditing={isEditing && !isSessionActive()}
                  onUpdate={(candidates) => handleUpdateSession({ candidates })}
                  isNominationActive={isNominationActive()}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <SessionMetadata 
                sessionData={sessionData as SessionData} 
                editData={editData as SessionData}
                isEditing={isEditing}
                isActive={isSessionActive()}
                onUpdate={handleUpdateSession}
                onChange={handleFieldChange}
              />
              <SessionSettings 
                sessionData={sessionData as SessionData} 
                editData={editData as SessionData}
                isEditing={isEditing}
                isActive={isSessionActive()}
                onUpdate={handleUpdateSession}
                onChange={handleFieldChange}
                hasProFeatures={hasProFeatures()}
              />
            </div>
            <div className="mt-6">
              {sessionData?.sessionType === "Poll" ? (
                <PollOptions
                  options={sessionData.pollOptions}
                  isEditing={isEditing && !isSessionActive()}
                  onUpdate={(options) => handleUpdateSession({ pollOptions: options })}
                />
              ) : (
                <CandidateTable
                  candidates={sessionData?.candidates || []}
                  isEditing={isEditing && !isSessionActive()}
                  onUpdate={(candidates) => handleUpdateSession({ candidates })}
                  isNominationActive={isNominationActive()}
                />
              )}
            </div>
          </>
        )}

        <SessionActions
          sessionType={sessionData?.sessionType || "Poll"}
          onStartSession={handleStartSession}
          onStopSession={handleStopSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  )
}
