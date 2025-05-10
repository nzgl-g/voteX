"use client";

import { useEffect, useState } from "react";
import { Plus, Key, RefreshCcw } from "lucide-react";
import { Session } from "@/api/session-service";
import { sessionService } from "@/api/session-service";
import { Button } from "@/components/ui/button";
import { candidateService } from "@/api/candidate-service";
import useNotification from "@/hooks/use-notification";
import { PricingDialog } from "@/components/pricing-dialog";
import { toast } from "sonner";
import {
  SessionCard,
  SecretPhraseDialog,
  VoterHeader
} from "@/components/voter-portal";
import CandidateFormDialog from "@/components/voter-portal/candidate-form-dialog";
import { authApi } from "@/lib/api";

export default function VoterPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hiddenSessions, setHiddenSessions] = useState<Session[]>([]);
  const [publicSessions, setPublicSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showSecretPhraseDialog, setShowSecretPhraseDialog] = useState(false);
  const [isSubmittingPhrase, setIsSubmittingPhrase] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the current user ID for notifications
  const [userId, setUserId] = useState<string>("anonymous");

  // Function to validate session data
  const isValidSession = (session: any): boolean => {
    if (!session || typeof session !== 'object') return false;
    if (!session._id || !session.name || !session.type) return false;
    
    // Check if sessionLifecycle exists and has the expected structure
    if (!session.sessionLifecycle || typeof session.sessionLifecycle !== 'object') {
      return false;
    }
    
    return true;
  };

  // Function to process sessions and separate them into public and hidden
  const processSessions = (allSessions: any[]): void => {
    if (!allSessions || !Array.isArray(allSessions) || allSessions.length === 0) {
      console.log("No sessions to process or invalid data format");
      setSessions([]);
      setPublicSessions([]);
      setHiddenSessions([]);
      return;
    }
    
    console.log(`Processing ${allSessions.length} sessions`);
    
    // Filter out invalid sessions
    const validSessions = allSessions.filter(session => isValidSession(session));
    
    if (validSessions.length < allSessions.length) {
      console.warn(`Filtered out ${allSessions.length - validSessions.length} invalid sessions`);
    }
    
    setSessions(validSessions);
    
    try {
      // Separate public and secret phrase sessions
      const public_sessions = validSessions.filter(session => 
        session.securityMethod !== 'Secret Phrase' || 
        (session.securityMethod === 'Secret Phrase' && !session.secretPhrase)
      );
      
      // Only hide sessions that actually have a secret phrase value
      const secret_sessions = validSessions.filter(session => 
        session.securityMethod === 'Secret Phrase' && 
        session.secretPhrase
      );
      
      console.log(`Processed sessions: ${public_sessions.length} public, ${secret_sessions.length} hidden`);
      
      if (public_sessions.length > 0) {
        console.log("Public session sample:", {
          id: public_sessions[0]._id,
          name: public_sessions[0].name,
          securityMethod: public_sessions[0].securityMethod
        });
      }
      
      setPublicSessions(public_sessions);
      setHiddenSessions(secret_sessions);
    } catch (err) {
      console.error("Error processing sessions:", err);
      setError("Error processing sessions. Please try again.");
    }
  };

  // Function to fetch all sessions
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching all sessions for voter portal...");
      const allSessions = await sessionService.getAvailableSessions();
      
      if (!allSessions || !Array.isArray(allSessions)) {
        throw new Error("Invalid response format from server");
      }
      
      processSessions(allSessions);
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err);
      setError(err.message || "Failed to load sessions. Please try again later.");
      toast.error("Failed to load sessions. Please try again later.");
      setSessions([]);
      setPublicSessions([]);
      setHiddenSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Handle joining as a candidate
  const handleJoinAsCandidate = async (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    try {
      // Check if user has already applied
      const hasApplied = await candidateService.hasUserApplied(session._id);
      if (hasApplied) {
        toast.info("You have already applied as a candidate for this session");
        return;
      }
      
      setSelectedSession(session);
      setShowCandidateForm(true);
    } catch (error) {
      console.error("Error checking candidate status:", error);
      toast.error("Failed to check candidate status. Please try again.");
    }
  };

  // Handle casting a vote
  const handleCastVote = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    // The VotingDialog is now handled by the SessionCard component
    console.log(`Vote submitted for session: ${session.name} (${session._id})`);
    toast.success(`Your vote for "${session.name}" has been recorded`);
  };

  // Handle showing results
  const handleShowResults = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    toast.info(`Showing results for ${session.name}`);
    // Implementation would depend on your app's navigation/routing
  };

  // Handle viewing profile
  const handleViewProfile = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    toast.info(`Viewing profile for ${session.name}`);
    // Implementation would depend on your app's navigation/routing
  };

  // Handle secret phrase submission
  const handleSecretPhraseSubmit = async (secretPhrase: string) => {
    if (!secretPhrase.trim()) {
      toast.error("Please enter a secret phrase");
      return;
    }

    setIsSubmittingPhrase(true);
    try {
      const session = await sessionService.getSessionByPhrase(secretPhrase);
      
      if (!isValidSession(session)) {
        throw new Error("Invalid session data received");
      }
      
      // If successful, add it to public sessions if not already there
      if (!publicSessions.some(s => s._id === session._id)) {
        setPublicSessions(prev => [...prev, session]);
        toast.success("Session accessed successfully");
        setShowSecretPhraseDialog(false);
      } else {
        toast.info("You already have access to this session");
      }
    } catch (error: any) {
      console.error("Failed to access session with phrase:", error);
      toast.error(error.message || "Invalid secret phrase. Please try again.");
    } finally {
      setIsSubmittingPhrase(false);
    }
  };

  // Handle refreshing sessions
  const refreshSessions = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    
    try {
      console.log("Refreshing all sessions for voter portal...");
      const allSessions = await sessionService.getAvailableSessions();
      
      if (!allSessions || !Array.isArray(allSessions)) {
        throw new Error("Invalid response format from server");
      }
      
      processSessions(allSessions);
      toast.success("Sessions refreshed successfully");
    } catch (err: any) {
      console.error("Failed to refresh sessions:", err);
      setError(err.message || "Failed to refresh sessions. Please try again later.");
      toast.error("Failed to refresh sessions. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <VoterHeader />

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Available Sessions</h1>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button 
              onClick={refreshSessions}
              variant="outline"
              className="flex items-center gap-2"
              disabled={refreshing || loading}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowSecretPhraseDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Enter Secret Phrase
            </Button>
            <Button 
              onClick={() => setShowPricingDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="grid place-items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={refreshSessions} 
              variant="outline" 
              className="mt-4"
              disabled={refreshing}
            >
              Try Again
            </Button>
          </div>
        ) : publicSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                onJoinAsCandidate={handleJoinAsCandidate}
                onCastVote={handleCastVote}
                onShowResults={handleShowResults}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sessions available at this time.</p>
          </div>
        )}
      </main>

      {/* Secret Phrase Dialog */}
      <SecretPhraseDialog
        open={showSecretPhraseDialog}
        onOpenChange={setShowSecretPhraseDialog}
        onSubmit={handleSecretPhraseSubmit}
        isSubmitting={isSubmittingPhrase}
      />

      {/* Pricing Dialog */}
      <PricingDialog 
        open={showPricingDialog} 
        onOpenChange={setShowPricingDialog} 
      />

      {/* Candidate Form Dialog */}
      {selectedSession && (
        <CandidateFormDialog 
          open={showCandidateForm}
          onOpenChange={setShowCandidateForm}
          sessionId={selectedSession._id}
          sessionTitle={selectedSession.name}
        />
      )}
    </div>
  );
}
