"use client";
import { useState, Suspense, useEffect } from "react";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { SessionCard } from "@/components/voter-portal/session-card";
import { SecretPhraseDialog } from "@/components/voter-portal/secret-phrase-dialog";
import { Button } from "@/components/shadcn-ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PricingDialog } from "@/components/pricing-dialog";
import { VoterSkeleton } from "@/components/voter-portal/voter-skeleton";
import { authApi } from "@/lib/api";

const MOCK_SESSIONS = [
    {
        id: "1",
        title: "Annual Board Elections",
        description: "Vote for the new board members of the organization. This election will determine leadership for the next fiscal year.",
        bannerUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
        status: "nomination" as const,
    },
    {
        id: "2",
        title: "Budget Proposal 2025",
        description: "Review and vote on the proposed budget for the 2025 fiscal year. Your input is crucial for financial planning.",
        bannerUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        status: "started" as const,
    },
    {
        id: "3",
        title: "Community Garden Initiative",
        description: "Vote on the proposal to allocate funds for a community garden in your neighborhood. Help shape your community!",
        bannerUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
        status: "ended" as const,
    },
    {
        id: "4",
        title: "New Technology Implementation",
        description: "Vote on which new technologies should be implemented in the organization to improve efficiency and productivity.",
        bannerUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
        status: "nomination" as const,
    },
    {
        id: "5",
        title: "Office Location Change",
        description: "Vote on the proposed new office locations. Your preference will help determine our next headquarters.",
        bannerUrl: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=800&q=80",
        status: "started" as const,
    },
    {
        id: "6",
        title: "Next Quarter Planning",
        description: "Upcoming planning session for Q2 2025. No nomination phase for this session.",
        bannerUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
        status: "upcoming" as const,
    },
    {
        id: "7",
        title: "Department Restructuring",
        description: "Upcoming session about the proposed department restructuring for 2025.",
        bannerUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
        status: "upcoming" as const,
    },
];

const VoterPortalContent = () => {
    const [sessions] = useState(MOCK_SESSIONS);
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({ 
        name: "User", 
        email: "" 
    });
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
    }, []);

    const handleViewSession = (sessionId: string) => {
        toast.info(`Viewing session: ${sessionId}`);
    };

    const handleJoinAsCandidate = (sessionId: string) => {
        toast.info(`Joining as candidate for session: ${sessionId}`);
    };

    const handleVote = (sessionId: string) => {
        toast.info(`Voting in session: ${sessionId}`);
    };

    const handleShowResults = (sessionId: string) => {
        toast.info(`Showing results for session: ${sessionId}`);
    };

    const handleSecretPhraseConfirmed = (phrase: string) => {
        toast.success(`Secret phrase confirmed: ${phrase}`);
    };

    const handleCreateSession = () => {
        toast.info("Creating new session");
        setShowPricingDialog(true);
    };

    const activeAndPastSessions = sessions.filter(s => s.status !== 'upcoming');
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming');

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
                    <h1 className="text-3xl font-bold">Your Sessions</h1>
                    <div className="flex gap-2">
                        <SecretPhraseDialog onPhraseConfirmed={handleSecretPhraseConfirmed} />
                        <Button onClick={handleCreateSession} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Session
                        </Button>
                    </div>
                </div>

                {activeAndPastSessions.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-semibold mb-4">Active & Past Sessions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeAndPastSessions.map((session) => (
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
                    </div>
                )}

                {upcomingSessions.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Upcoming Sessions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingSessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    title={session.title}
                                    description={session.description}
                                    bannerUrl={session.bannerUrl}
                                    status={session.status}
                                    onViewSession={() => handleViewSession(session.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <PricingDialog 
                open={showPricingDialog} 
                onOpenChange={setShowPricingDialog} 
            />
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
