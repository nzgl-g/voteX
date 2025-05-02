"use client";
import { useState, Suspense, useEffect } from "react";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { sessionService, Session } from "@/api/session-service";
import { candidateService } from "@/api/candidate-service";
import { SessionCard } from "@/components/voter-portal/session-card";
import { SecretPhraseDialog } from "@/components/voter-portal/secret-phrase-dialog";
import { CandidateNominationForm } from "@/components/voter-portal/candidate-nomination-form";
import { ElectionResultsDialog } from "@/components/voter-portal/election-results-dialog";
import { VotingDialog } from "@/components/voter-portal/voting-dialog";
import { Button } from "@/components/shadcn-ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PricingDialog } from "@/components/pricing-dialog";
import { authApi } from "@/lib/api";

// Interface for our formatted session data
interface FormattedSession {
    id: string;
    title: string;
    description: string;
    bannerUrl: string;
    status: "nomination" | "upcoming" | "started" | "ended";
    secretPhrase?: string;
    hasAppliedAsCandidate?: boolean;
}

const VoterPortalContent = () => {
    const [sessions, setSessions] = useState<FormattedSession[]>([]);
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({
        name: "User",
        email: ""
    });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [resultsSessionId, setResultsSessionId] = useState<string | null>(null);
    const [resultsSessionTitle, setResultsSessionTitle] = useState("");
    const [votingSessionId, setVotingSessionId] = useState<string | null>(null);
    const [votingSessionTitle, setVotingSessionTitle] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userProfile = await authApi.fetchUserProfile();
                setUserData({
                    name: userProfile.name || "User",
                    email: userProfile.email || "",
                    avatar: userProfile.avatar || undefined
                });
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            }
        };

        fetchUserData();

        // Fetch all sessions
        fetchSessions();
    }, []);

    // Function to fetch all sessions
    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            // Fetch all sessions
            const allSessions = await sessionService.getAllSessions();

            // Filter out private sessions with secret phrase (only show public sessions by default)
            const publicSessions = allSessions.filter(session => 
                session.accessLevel === 'Public' || 
                (session.accessLevel === 'Private' && !session.securityMethod || session.securityMethod !== 'Secret Phrase')
            );

            // Format the sessions for display
            const formattedSessions: FormattedSession[] = [];
            
            // Process each session individually to avoid Promise.all failures
            for (const session of publicSessions) {
                try {
                    // Check if the user has already applied as a candidate for this session
                    let hasApplied = false;
                    try {
                        hasApplied = await candidateService.hasUserApplied(session._id);
                    } catch (error) {
                        // Silently handle errors here - we'll assume the user hasn't applied
                        console.warn(`Failed to check candidate status for session ${session._id}:`, error);
                    }
                    
                    formattedSessions.push({
                        id: session._id,
                        title: session.name,
                        description: session.description || "No description available",
                        bannerUrl: session.banner || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
                        status: mapSessionStatus(session.sessionLifecycle) as "nomination" | "upcoming" | "started" | "ended",
                        secretPhrase: session.secretPhrase,
                        hasAppliedAsCandidate: hasApplied
                    });
                } catch (error) {
                    console.error(`Error processing session ${session._id}:`, error);
                    // Continue with the next session
                }
            }
                
            setSessions(formattedSessions);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load sessions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewSession = (sessionId: string) => {
        toast.info(`Viewing session: ${sessionId}`);
    };

    const handleJoinAsCandidate = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setShowCandidateForm(true);
    };

    const handleCandidateFormClose = () => {
        setShowCandidateForm(false);
        setSelectedSessionId(null);
    };

    const handleCandidateFormSubmit = async (data: any) => {
        try {
            if (!selectedSessionId) {
                throw new Error("No session selected");
            }

            // Submit the candidate application
            const result = await candidateService.applyAsCandidate(selectedSessionId, data);
            
            // Update the session to show that the user has applied
            setSessions(prevSessions => 
                prevSessions.map(session => 
                    session.id === selectedSessionId 
                        ? { ...session, hasAppliedAsCandidate: true } 
                        : session
                )
            );

            toast.success(result.message || "Your nomination has been submitted successfully");
            setShowCandidateForm(false);
            setSelectedSessionId(null);
        } catch (error: any) {
            console.error("Error submitting nomination:", error);
            toast.error(error.message || "Failed to submit nomination. Please try again.");
        }
    };

    const handleVote = (sessionId: string) => {
        // Find the session title for the selected session
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setVotingSessionId(sessionId);
            setVotingSessionTitle(session.title);
        }
    };

    const handleVoteSubmitted = async (candidateId: string) => {
        // This will be replaced with the actual API call when implemented
        console.log("Vote submitted for candidate:", candidateId);
        console.log("In session:", votingSessionId);

        toast.success("Your vote has been recorded successfully");
        setVotingSessionId(null);
        setVotingSessionTitle("");
    };

    const handleCloseVoting = () => {
        setVotingSessionId(null);
        setVotingSessionTitle("");
    };

    const handleShowResults = (sessionId: string) => {
        // Find the session title for the selected session
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setResultsSessionId(sessionId);
            setResultsSessionTitle(session.title);
        }
    };

    const handleCloseResults = () => {
        setResultsSessionId(null);
        setResultsSessionTitle("");
    };

    const handleSecretPhraseConfirmed = async (phrase: string) => {
        setIsLoading(true);
        try {
            const session = await sessionService.getSessionByPhrase(phrase);
            
            // Verify this is a valid session that should be accessible via secret phrase
            if (session.accessLevel !== 'Private' || session.securityMethod !== 'Secret Phrase') {
                throw new Error("This session does not require a secret phrase to access");
            }

            // Check if the user has already applied as a candidate for this session
            let hasApplied = false;
            try {
                hasApplied = await candidateService.hasUserApplied(session._id);
            } catch (error) {
                console.error(`Failed to check candidate status for session ${session._id}:`, error);
                // Continue with hasApplied = false if there's an error
            }

            // Map the server response to match our session format
            const formattedSession: FormattedSession = {
                id: session._id,
                title: session.name,
                description: session.description || "No description available",
                bannerUrl: session.banner || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
                status: mapSessionStatus(session.sessionLifecycle) as "nomination" | "upcoming" | "started" | "ended",
                secretPhrase: session.secretPhrase,
                hasAppliedAsCandidate: hasApplied
            };

            // Check if session already exists in the list (to avoid duplicates)
            const exists = sessions.some(s => s.id === formattedSession.id);

            if (!exists) {
                // Add the new session to the beginning of the array
                setSessions(prevSessions => [formattedSession, ...prevSessions]);
                toast.success(`Session "${session.name}" added successfully`);
            } else {
                toast.info("This session is already in your list");
            }
        } catch (error: any) {
            console.error("Failed to get session by phrase:", error);
            toast.error(error.message || "Invalid secret phrase or session not found");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to map session lifecycle to our status format
    const mapSessionStatus = (lifecycle: any): "nomination" | "upcoming" | "started" | "ended" => {
        const now = new Date();
        
        // Check if session has officially ended
        if (lifecycle.endedAt && new Date(lifecycle.endedAt) < now) {
            return "ended";
        }
        
        // Check if session has officially started
        if (lifecycle.startedAt && new Date(lifecycle.startedAt) < now) {
            // If it has started but not yet reached end time
            if (!lifecycle.endedAt || new Date(lifecycle.endedAt) > now) {
                return "started";
            }
            return "ended"; // If end date exists and has passed
        }
        
        // Check if session is scheduled in the future
        const startDate = lifecycle.scheduledAt?.start ? new Date(lifecycle.scheduledAt.start) : null;
        const endDate = lifecycle.scheduledAt?.end ? new Date(lifecycle.scheduledAt.end) : null;
        
        // If a start date is defined and it's in the future, session is upcoming
        if (startDate && startDate > now) {
            return "upcoming";
        }
        
        // If a start date is defined, has passed, but the end date is in the future
        if (startDate && startDate < now && endDate && endDate > now) {
            return "started";
        }
        
        // If both start and end dates are defined and both have passed
        if (startDate && endDate && endDate < now) {
            return "ended";
        }
        
        // Default to nomination phase (when no specific dates are set or matched)
        return "nomination";
    };

    const handleCreateSession = () => {
        // Show pricing dialog
        setShowPricingDialog(true);
    };

    const handlePlanSelected = (plan: "free" | "pro" | "enterprise") => {
        // Close pricing dialog
        setShowPricingDialog(false);

        // Navigate to session setup page with the selected plan
        router.push(`/session-setup?plan=${plan}`);
    };

    return (
        <>
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center">
                            <div className="hidden dark:block">
                                <Image src="/logo/expended-dark.png" alt="Vote System Logo" width={120} height={40} className="mr-2" />
                            </div>
                            <div className="block dark:hidden">
                                <Image src="/logo/expended.png" alt="Vote System Logo" width={120} height={40} className="mr-2" />
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserProfile
                            userName={userData.name}
                            userEmail={userData.email}
                            userAvatar={userData.avatar}
                            variant="dropdown"
                        />
                    </div>
                </div>
            </header>

            <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">All Sessions</h1>
                    <div className="flex gap-2">
                        <SecretPhraseDialog onPhraseConfirmed={handleSecretPhraseConfirmed} />
                        <Button onClick={handleCreateSession} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Session
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
                        ))}
                    </div>
                ) : sessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                title={session.title}
                                description={session.description}
                                bannerUrl={session.bannerUrl}
                                status={session.status}
                                hasAppliedAsCandidate={session.hasAppliedAsCandidate}
                                onViewSession={() => handleViewSession(session.id)}
                                onJoinAsCandidate={() => handleJoinAsCandidate(session.id)}
                                onVote={() => handleVote(session.id)}
                                onShowResults={() => handleShowResults(session.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-6 mb-4">
                            <Image
                                src="/images/empty-state.svg"
                                alt="No sessions"
                                width={120}
                                height={120}
                                className="opacity-70"
                            />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No Sessions Available</h2>
                        <p className="text-muted-foreground max-w-md mb-6">
                            There are no active sessions at the moment. Create a new session or enter a secret phrase to join one.
                        </p>
                        <div className="flex gap-4">
                            <SecretPhraseDialog onPhraseConfirmed={handleSecretPhraseConfirmed} />
                            <Button onClick={handleCreateSession}>Create New Session</Button>
                        </div>
                    </div>
                )}
            </main>

            <PricingDialog
                open={showPricingDialog}
                onOpenChange={setShowPricingDialog}
                onPlanSelected={handlePlanSelected}
            />

            {selectedSessionId && showCandidateForm && (
                <CandidateNominationForm
                    sessionId={selectedSessionId}
                    onSubmit={handleCandidateFormSubmit}
                    onClose={handleCandidateFormClose}
                />
            )}

            {resultsSessionId && (
                <ElectionResultsDialog
                    sessionId={resultsSessionId}
                    sessionTitle={resultsSessionTitle}
                    onClose={handleCloseResults}
                />
            )}

            {votingSessionId && (
                <VotingDialog
                    sessionId={votingSessionId}
                    sessionTitle={votingSessionTitle}
                    onClose={handleCloseVoting}
                    onVoteSubmitted={handleVoteSubmitted}
                />
            )}
        </>
    );
};

const Index = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
                <VoterPortalContent />
        </div>
    );
};

export default Index;