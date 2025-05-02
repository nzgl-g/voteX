"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/shadcn-ui/dialog";
import { Button } from "@/components/shadcn-ui/button";
import { Card, CardContent } from "@/components/shadcn-ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar";
import { Check, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn-ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn-ui/radio-group";
import { Label } from "@/components/shadcn-ui/label";

// Mock data - will be replaced with API data later
interface Candidate {
    id: string;
    name: string;
    avatar?: string;
    biography: string;
    promises: string[];
}

interface VotingDialogProps {
    sessionId: string;
    sessionTitle: string;
    onClose?: () => void;
    onVoteSubmitted?: (candidateId: string) => void;
}

export function VotingDialog({
                                 sessionId,
                                 sessionTitle,
                                 onClose,
                                 onVoteSubmitted
                             }: VotingDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);

    // Open dialog when sessionId changes
    useEffect(() => {
        if (sessionId) {
            setOpen(true);
            loadCandidates();
        }
    }, [sessionId]);

    const handleClose = () => {
        setOpen(false);
        if (onClose) {
            onClose();
        }
    };

    // Mock function to load candidates - will be replaced with an API call
    const loadCandidates = async () => {
        setIsLoading(true);

        try {
            // Simulate API delay
            setTimeout(() => {
                const mockCandidates: Candidate[] = [
                    {
                        id: '1',
                        name: 'John Smith',
                        avatar: 'https://i.pravatar.cc/150?img=1',
                        biography: 'Experienced community leader with a passion for education and sustainable development.',
                        promises: [
                            'Improve educational resources for all members',
                            'Create more transparency in decision making',
                            'Implement eco-friendly initiatives'
                        ]
                    },
                    {
                        id: '2',
                        name: 'Sarah Johnson',
                        avatar: 'https://i.pravatar.cc/150?img=5',
                        biography: 'Technology expert with 10 years experience in building inclusive digital platforms.',
                        promises: [
                            'Build a more accessible platform for all members',
                            'Introduce digital literacy programs',
                            'Create mentorship opportunities for newcomers'
                        ]
                    },
                    {
                        id: '3',
                        name: 'Michael Brown',
                        avatar: 'https://i.pravatar.cc/150?img=8',
                        biography: 'Finance professional dedicated to responsible resource allocation and growth.',
                        promises: [
                            'Ensure transparent financial management',
                            'Develop sustainable fundraising strategies',
                            'Allocate resources based on community needs'
                        ]
                    },
                ];

                setCandidates(mockCandidates);
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Failed to load candidates:", error);
            setIsLoading(false);
        }
    };

    const handleSubmitVote = async () => {
        if (!selectedCandidateId) {
            toast.error("Please select a candidate");
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call the callback if provided
            if (onVoteSubmitted) {
                onVoteSubmitted(selectedCandidateId);
            }

            toast.success("Your vote has been recorded successfully");
            setOpen(false);
        } catch (error) {
            console.error("Failed to submit vote:", error);
            toast.error("Failed to submit your vote. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewCandidateDetails = (candidateId: string) => {
        setViewingCandidateId(candidateId);
    };

    const handleBackToVoting = () => {
        setViewingCandidateId(null);
    };

    // Get the currently viewed candidate details
    const viewedCandidate = viewingCandidateId
        ? candidates.find(c => c.id === viewingCandidateId)
        : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {viewingCandidateId ? 'Candidate Profile' : 'Cast Your Vote'}
                    </DialogTitle>
                    <DialogDescription>
                        {viewingCandidateId
                            ? `Viewing profile for: ${viewedCandidate?.name}`
                            : `Voting for: ${sessionTitle}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading candidates...</p>
                    </div>
                ) : viewingCandidateId ? (
                    // Candidate details view
                    <div className="space-y-6">
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={viewedCandidate?.avatar} alt={viewedCandidate?.name || ''} />
                                <AvatarFallback>{viewedCandidate?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-xl font-semibold">{viewedCandidate?.name}</h3>
                                <p className="text-muted-foreground mt-2">{viewedCandidate?.biography}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Key Promises</h4>
                            <ul className="space-y-2">
                                {viewedCandidate?.promises.map((promise, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{promise}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleBackToVoting}>
                                Back to Voting
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Voting view
                    <div className="space-y-6 py-4">
                        <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                            <Info className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm">Select a candidate and click "Vote" to cast your ballot. This action cannot be undone.</p>
                        </div>

                        <RadioGroup
                            value={selectedCandidateId || ""}
                            onValueChange={setSelectedCandidateId}
                            className="space-y-4"
                        >
                            {candidates.map((candidate) => (
                                <div key={candidate.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} />
                                    <Label
                                        htmlFor={`candidate-${candidate.id}`}
                                        className="flex flex-1 items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium">{candidate.name}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-1">
                                                {candidate.biography}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleViewCandidateDetails(candidate.id);
                                            }}
                                        >
                                            View profile
                                        </Button>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        <DialogFooter className="pt-4">
                            <Button
                                onClick={handleSubmitVote}
                                disabled={!selectedCandidateId || isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Vote"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}