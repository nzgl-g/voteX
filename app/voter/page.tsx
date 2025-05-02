"use client";
import { useState, Suspense, useEffect } from "react";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { sessionService, Session } from "@/api/session-service";
import { SessionCard } from "@/components/voter-portal/session-card-modern";
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
import { VoterSkeleton } from "@/components/voter-portal/voter-skeleton";
import { authApi } from "@/lib/api";

// Interface for our formatted session data
interface FormattedSession {
    id: string;
    title: string;
    description: string;
    bannerUrl: string;
    status: "nomination" | "upcoming" | "started" | "ended";
    secretPhrase?: string;
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
            
            // Format the sessions for display
            const formattedSessions = allSessions.map(session => ({
                id: session._id,
                title: session.name,
                description: session.description || "No description available",
                bannerUrl: session.banner || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
                status: mapSessionStatus(session.sessionLifecycle) as "nomination" | "upcoming" | "started" | "ended",
                secretPhrase: session.secretPhrase
            }));
            
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

    const handleCandidateFormSubmit = async (data: any) => {
        // This will be replaced with the actual API call when implemented
        console.log("Candidate form submitted:", data);
        console.log("For session:", selectedSessionId);
        
        toast.success("Your nomination has been submitted successfully");
        setShowCandidateForm(false);
        setSelectedSessionId(null);
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
            
            // Map the server response to match our session format
            const formattedSession: FormattedSession = {
                id: session._id,
                title: session.name,
                description: session.description || "No description available",
                bannerUrl: session.banner || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
                status: mapSessionStatus(session.sessionLifecycle) as "nomination" | "upcoming" | "started" | "ended",
                secretPhrase: session.secretPhrase
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
        } catch (error) {
            console.error("Failed to get session by phrase:", error);
            toast.error("Invalid secret phrase or session not found");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper function to map session lifecycle to our status format
    const mapSessionStatus = (lifecycle: any): "nomination" | "upcoming" | "started" | "ended" => {
        const now = new Date();
        const startDate = lifecycle.scheduledAt?.start ? new Date(lifecycle.scheduledAt.start) : null;
        const endDate = lifecycle.scheduledAt?.end ? new Date(lifecycle.scheduledAt.end) : null;
        
        if (lifecycle.endedAt) return "ended";
        if (lifecycle.startedAt) return "started";
        if (startDate && startDate > now) return "upcoming";
        return "nomination"; // Default state
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

            {selectedSessionId && (
                <CandidateNominationForm
                    sessionId={selectedSessionId}
                    onSubmit={handleCandidateFormSubmit}
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
            <Suspense fallback={<VoterSkeleton />}>
                <VoterPortalContent />
            </Suspense>
        </div>
    );
};

export default Index;
