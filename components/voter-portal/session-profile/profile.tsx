"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, Building2, Users, Vote, CheckCircle2, AlertCircle, Timer, Loader2, LockIcon } from "lucide-react"
import Image from "next/image"
import { getSessionLifecycleStatus } from "../session-card"

interface Candidate {
    _id: string;
    fullName: string;
    partyName?: string;
    biography?: string;
    voteCount?: number;
}

interface PollOption {
    _id: string;
    name: string;
    description?: string;
    voteCount?: number;
}

interface SessionTabsProps {
    session: any;
}

export default function SessionTabs({ session }: SessionTabsProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [showCandidateProfile, setShowCandidateProfile] = useState(false)
    const [isLoadingResults, setIsLoadingResults] = useState(false)
    
    if (!session) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading session data...</span>
            </div>
        )
    }

    const lifecycleStatus = getSessionLifecycleStatus(session);
    const isSessionEnded = lifecycleStatus.status === 'ended';
    const canShowResults = session.resultVisibility === 'real-time' || 
                          (session.resultVisibility === 'post-completion' && isSessionEnded);
    
    // Calculate timeline progress
    const getTimelineProgress = () => {
        try {
            const now = new Date();
            let startDate, endDate;
            
            if (session.sessionLifecycle?.startedAt) {
                startDate = new Date(session.sessionLifecycle.startedAt);
            } else if (session.sessionLifecycle?.scheduledAt?.start) {
                startDate = new Date(session.sessionLifecycle.scheduledAt.start);
            } else {
                startDate = new Date(session.sessionLifecycle?.createdAt || Date.now());
            }
            
            if (session.sessionLifecycle?.endedAt) {
                endDate = new Date(session.sessionLifecycle.endedAt);
            } else if (session.sessionLifecycle?.scheduledAt?.end) {
                endDate = new Date(session.sessionLifecycle.scheduledAt.end);
            } else {
                // Default to 24 hours after start if no end date is set
                endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 24);
            }
            
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsed = Math.max(0, Math.min(now.getTime() - startDate.getTime(), totalDuration));
            return (elapsed / totalDuration) * 100;
        } catch (error) {
            console.error("Error calculating timeline progress:", error);
            return 0;
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

    const formatTime = (timeString: string | null | undefined): string => {
        if (!timeString) return "Not scheduled";
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error("Error formatting time:", error);
            return "Invalid time";
        }
    };

    const handleViewCandidateProfile = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setShowCandidateProfile(true);
    };

    return (
        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
                <Card>
                    <div className="relative h-48 md:h-64 w-full overflow-hidden rounded-t-lg">
                        <Image
                            src={session.banner || "/placeholder.svg"}
                            alt="Session banner"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{session.name}</CardTitle>
                                <CardDescription className="mt-2 max-w-3xl">{session.description || "No description provided"}</CardDescription>
                            </div>
                            <Badge variant="outline" className={`${lifecycleStatus.color} px-2.5 py-0.5 text-xs font-medium flex items-center shadow-sm backdrop-blur-sm`}>
                                {lifecycleStatus.icon}
                                {lifecycleStatus.label}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {session.organizationName && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">Organization:</span> {session.organizationName}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="font-medium">Type:</span> {session.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Vote className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="font-medium">Mode:</span> {session.subtype || "single"} selection
                                </span>
                            </div>
                            {session.resultVisibility && (
                                <div className="flex items-center gap-2">
                                    <LockIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">Results:</span> {session.resultVisibility === 'real-time' ? 'Available in real-time' : 'Available after completion'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Session Timeline</h3>
                                <div className="relative">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${getTimelineProgress()}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                        <span>{formatDate(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}</span>
                                        <span>{formatDate(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">Start Date:</span>{" "}
                                        {formatDate(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">End Date:</span>{" "}
                                        {formatDate(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">Start Time:</span>{" "}
                                        {formatTime(session.sessionLifecycle?.startedAt || session.sessionLifecycle?.scheduledAt?.start)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="font-medium">End Time:</span>{" "}
                                        {formatTime(session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{session.type === "election" ? "Candidates" : "Poll Options"}</CardTitle>
                        <CardDescription>
                            {session.type === "election"
                                ? "View candidate information and profiles"
                                : "Available options for this poll"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {session.type === "election" ? (
                            <div className="space-y-4">
                                {session.candidates && session.candidates.length > 0 ? (
                                    session.candidates.map((candidate: Candidate) => (
                                        <Card key={candidate._id}>
                                            <CardContent className="flex items-center justify-between p-6">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold">{candidate.fullName}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {candidate.partyName || "No party affiliation"}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleViewCandidateProfile(candidate)}
                                                >
                                                    View Profile
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Candidates Yet</h3>
                                        <p className="text-muted-foreground">
                                            This session doesn't have any candidates registered yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {session.options && session.options.length > 0 ? (
                                    session.options.map((option: PollOption) => (
                                        <Card key={option._id}>
                                            <CardContent className="p-6">
                                                <h3 className="font-semibold">{option.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {option.description || "No description provided"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Options Available</h3>
                                        <p className="text-muted-foreground">
                                            This poll doesn't have any options configured yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Session Results</CardTitle>
                        <CardDescription>Current results for {session.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingResults ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Loading results...</p>
                            </div>
                        ) : canShowResults ? (
                            <>
                                {session.type === "election" ? (
                                    <div className="space-y-4">
                                        {session.candidates && session.candidates.length > 0 ? (
                                            session.candidates
                                                .sort((a: Candidate, b: Candidate) => (b.voteCount || 0) - (a.voteCount || 0))
                                                .map((candidate: Candidate, index: number) => {
                                                    const totalVotes = session.candidates.reduce(
                                                        (sum: number, c: Candidate) => sum + (c.voteCount || 0), 
                                                        0
                                                    );
                                                    const percentage = totalVotes > 0 ? ((candidate.voteCount || 0) / totalVotes) * 100 : 0;

                                                    return (
                                                        <div key={candidate._id} className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg font-semibold">#{index + 1}</span>
                                                                    <span className="font-medium">{candidate.fullName}</span>
                                                                </div>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {candidate.voteCount || 0} votes ({percentage.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-300"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                        ) : (
                                            <div className="text-center py-8">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-medium mb-2">No Candidates</h3>
                                                <p className="text-muted-foreground">
                                                    This session doesn't have any candidates to show results for.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {session.options && session.options.length > 0 ? (
                                            session.options
                                                .sort((a: PollOption, b: PollOption) => (b.voteCount || 0) - (a.voteCount || 0))
                                                .map((option: PollOption) => {
                                                    const totalVotes = session.options.reduce(
                                                        (sum: number, o: PollOption) => sum + (o.voteCount || 0), 
                                                        0
                                                    );
                                                    const percentage = totalVotes > 0 ? ((option.voteCount || 0) / totalVotes) * 100 : 0;

                                                    return (
                                                        <div key={option._id} className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium">{option.name}</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {option.voteCount || 0} votes ({percentage.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-300"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                        ) : (
                                            <div className="text-center py-8">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-medium mb-2">No Options Available</h3>
                                                <p className="text-muted-foreground">
                                                    This poll doesn't have any options to show results for.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Votes:</span>
                                        <span className="font-medium">
                                            {session.type === "election" && session.candidates
                                                ? session.candidates.reduce((sum: number, c: Candidate) => sum + (c.voteCount || 0), 0)
                                                : session.type === "poll" && session.options
                                                ? session.options.reduce((sum: number, o: PollOption) => sum + (o.voteCount || 0), 0)
                                                : 0}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <LockIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">Results Not Available Yet</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    {session.resultVisibility === 'post-completion' 
                                        ? "Results will be available after the session has ended."
                                        : "Results are not available for viewing at this time."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Candidate Profile Dialog */}
            <Dialog open={showCandidateProfile} onOpenChange={setShowCandidateProfile}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedCandidate?.fullName}</DialogTitle>
                        <DialogDescription>Candidate Profile</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedCandidate?.partyName && (
                            <div>
                                <h4 className="font-medium mb-2">Party</h4>
                                <p className="text-sm text-muted-foreground">{selectedCandidate.partyName}</p>
                            </div>
                        )}
                        {selectedCandidate?.biography && (
                            <div>
                                <h4 className="font-medium mb-2">Biography</h4>
                                <p className="text-sm text-muted-foreground">{selectedCandidate.biography}</p>
                            </div>
                        )}
                        {!selectedCandidate?.biography && !selectedCandidate?.partyName && (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground">No additional information available for this candidate.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Tabs>
    )
}
