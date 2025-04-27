"use client";
import { useState } from "react";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { UserMenu } from "@/components/voter-portal/user-menu";
import { SessionCard } from "@/components/voter-portal/session-card";
import { SecretPhraseDialog } from "@/components/voter-portal/secret-phrase-dialog";
import { Button } from "@/components/shadcn-ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Calendar } from "lucide-react";

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

const Index = () => {
    const [sessions] = useState(MOCK_SESSIONS);

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
    };

    const activeAndPastSessions = sessions.filter(s => s.status !== 'upcoming');
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming');

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                VV
                            </div>
                            <span className="font-semibold hidden md:inline-block">Vote Vista</span>
                        </div>

                        <ThemeToggle className="md:hidden" />
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle className="hidden md:flex" />

                        <UserMenu userName="John Doe" />
                    </div>
                </div>
            </header>

            <main className="container py-6 md:py-10">
                <div className="flex flex-col gap-8">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold">Vote Sessions</h1>
                                <p className="text-muted-foreground">Available voting sessions for you</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <SecretPhraseDialog onPhraseConfirmed={handleSecretPhraseConfirmed} />
                                <Button onClick={handleCreateSession} className="sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Create Session
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeAndPastSessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    title={session.title}
                                    description={session.description}
                                    bannerUrl={session.bannerUrl}
                                    status={session.status}
                                    onViewSession={() => handleViewSession(session.id)}
                                    onJoinAsCandidate={
                                        session.status === "nomination"
                                            ? () => handleJoinAsCandidate(session.id)
                                            : undefined
                                    }
                                    onVote={
                                        session.status === "started"
                                            ? () => handleVote(session.id)
                                            : undefined
                                    }
                                    onShowResults={
                                        session.status === "ended"
                                            ? () => handleShowResults(session.id)
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    {upcomingSessions.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="h-5 w-5" />
                                <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </div>
            </main>
        </div>
    );
};

export default Index;
