"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Vote, AlertCircle, ThumbsUp, Mail, Shield, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from '@/lib/toast';
import sessionService from "@/services/session-service";
import metamaskService from "@/services/metamask-service";
import blockchainService from "@/services/blockchain-service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export type VoteType = "poll" | "elections"
export type VoteMode = "single" | "multiple"

export interface VotingOption {
    id: string
    title: string
    description?: string
    voteCount?: number
}

export interface Candidate {
    id: string
    title: string
    biography?: string
    voteCount?: number
}

export interface KYCData {
    fullName: string
    nationality: string
    dateOfBirth: string
    idCardNumber: string
    idCardDocument: File | null
}

export interface VotingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: string
    onVoteSubmitted?: (data: any) => void
}

export function VotingDialog({
    open,
    onOpenChange,
    sessionId,
    onVoteSubmitted,
}: VotingDialogProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);
    const [isBlockchainSession, setIsBlockchainSession] = useState(false);
    const [voteData, setVoteData] = useState<{
        type: string;
        subtype: string;
        title: string;
        description?: string;
        candidates?: Array<{
            _id: string;
            name: string;
            bio?: string;
            image?: string;
        }>;
        options?: Array<{
            _id: string;
            text: string;
            description?: string;
        }>;
        maxChoices: number;
    } | null>(null);

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    useEffect(() => {
        if (open && sessionId) {
            loadVoteOptions();
        } else {
            // Reset selections when dialog closes
            setSelectedOptions([]);
            setBlockchainTxHash(null);
        }
    }, [open, sessionId]);

    const loadVoteOptions = async () => {
        try {
            setLoading(true);
            const data = await sessionService.getVoteOptions(sessionId);
            setVoteData(data);
            
            // Check if this is a blockchain session
            const session = await sessionService.getSessionById(sessionId);
            setIsBlockchainSession(!!session.contractAddress);
            
            // Initialize selected options based on vote subtype
            if (data.subtype === "single" && (data.candidates?.length || data.options?.length)) {
                setSelectedOptions([]);
            } else {
                setSelectedOptions([]);
            }
        } catch (error) {
            console.error("Error loading vote options:", error);
            toast({
                title: "Error",
                description: "Failed to load voting options. Please try again.",
                variant: "destructive",
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionId: string) => {
        if (voteData?.subtype === "single") {
            setSelectedOptions([optionId]);
        } else {
            // For multiple selection
            if (selectedOptions.includes(optionId)) {
                setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
            } else {
                // Check if maximum choices limit is reached
                if (selectedOptions.length < (voteData?.maxChoices || 1)) {
                    setSelectedOptions([...selectedOptions, optionId]);
                } else {
                    toast({
                        title: "Maximum Selections Reached",
                        description: `You can only select up to ${voteData?.maxChoices} option${voteData?.maxChoices !== 1 ? "s" : ""}.`,
                        variant: "destructive",
                    });
                }
            }
        }
    };

    const handleSubmitVote = async () => {
        if (selectedOptions.length === 0) {
            toast({
                title: "Selection Required",
                description: "Please select at least one option to cast your vote.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            
            // For blockchain sessions, we need to connect to MetaMask first
            if (isBlockchainSession) {
                console.log("[VotingDialog] Blockchain session detected, connecting to MetaMask...");
                try {
                    const connected = await metamaskService.connect();
                    if (!connected) {
                        toast({
                            title: "Wallet Connection Required",
                            description: "Please connect your MetaMask wallet to cast your vote.",
                            variant: "destructive"
                        });
                        throw new Error("MetaMask connection required");
                    }
                    console.log("[VotingDialog] MetaMask connected successfully");
                } catch (metamaskError) {
                    console.error("[VotingDialog] MetaMask connection error:", metamaskError);
                    throw new Error("Failed to connect to MetaMask wallet");
                }
            }
            
            // Prepare vote data for the session service
            const voteData = {
                candidateId: selectedOptions[0],
                selectedOptions: selectedOptions
            };
            
            console.log("[VotingDialog] Submitting vote data:", voteData);
            
            // Submit the vote through the session service
            const result = await sessionService.castVote(sessionId, voteData);
            
            // Validate the result
            if (!result) {
                throw new Error("Invalid response received");
            }
            
            console.log("[VotingDialog] Vote submission result:", result);
            
            // If there's a blockchain transaction hash, store it
            if (result.txHash) {
                setBlockchainTxHash(result.txHash);
                toast({
                    title: "Blockchain Vote Submitted",
                    description: "Your vote has been submitted on the blockchain and is being processed.",
                });
            } else {
                toast({
                    title: "Vote Submitted",
                    description: "Your vote has been successfully recorded.",
                });
            }
            
            if (onVoteSubmitted) {
                onVoteSubmitted({
                    selectedOptions,
                    sessionId,
                    voteId: result.voteId || 'anonymous',
                    success: true
                });
            }
            
            // If it's not a blockchain vote or the tx is complete, close the dialog
            if (!result.txHash) {
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error("Error submitting vote:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit your vote. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Function to render blockchain transaction status
    const renderBlockchainStatus = () => {
        if (!blockchainTxHash) return null;
        
        const explorerUrl = `https://sepolia.etherscan.io/tx/${blockchainTxHash}`;
        
        return (
            <div className="mt-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Blockchain Transaction</AlertTitle>
                    <AlertDescription>
                        Your vote has been submitted to the blockchain. 
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(explorerUrl, '_blank')}
                            >
                                View on Etherscan <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{voteData?.title || "Cast Your Vote"}</DialogTitle>
                    <DialogDescription>
                        {voteData?.description || "Select your preferred option(s) and submit your vote."}
                        {voteData?.subtype === "multiple" && (
                            <span className="block mt-1 font-medium text-xs">
                                You can select up to {voteData.maxChoices} option{voteData.maxChoices !== 1 ? "s" : ""}.
                            </span>
                        )}
                        {isBlockchainSession && (
                            <span className="block mt-1 font-medium text-xs">
                                This vote will be recorded on the blockchain for transparency and security.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading voting options...</span>
                    </div>
                ) : blockchainTxHash ? (
                    renderBlockchainStatus()
                ) : (
                    <ScrollArea className="flex-grow">
                        <div className="py-4 space-y-4">
                            {voteData?.type === "election" && voteData.candidates && (
                                voteData.subtype === "single" ? (
                                    <RadioGroup value={selectedOptions[0] || ""} className="space-y-3">
                                        {voteData.candidates.map((candidate) => (
                                            <div
                                                key={candidate._id}
                                                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                                                onClick={() => handleOptionSelect(candidate._id)}
                                            >
                                                <RadioGroupItem value={candidate._id} id={candidate._id} />
                                                <div className="flex-1 flex">
                                                    <Avatar className="h-10 w-10 mr-3">
                                                        <AvatarImage src={candidate.image} alt={candidate.name} />
                                                        <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <Label htmlFor={candidate._id} className="text-base font-medium">
                                                            {candidate.name}
                                                        </Label>
                                                        {candidate.bio && (
                                                            <p className="text-sm text-muted-foreground">{candidate.bio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="space-y-3">
                                        {voteData.candidates.map((candidate) => (
                                            <div
                                                key={candidate._id}
                                                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                                                onClick={() => handleOptionSelect(candidate._id)}
                                            >
                                                <Checkbox
                                                    checked={selectedOptions.includes(candidate._id)}
                                                    id={candidate._id}
                                                />
                                                <div className="flex-1 flex">
                                                    <Avatar className="h-10 w-10 mr-3">
                                                        <AvatarImage src={candidate.image} alt={candidate.name} />
                                                        <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <Label htmlFor={candidate._id} className="text-base font-medium">
                                                            {candidate.name}
                                                        </Label>
                                                        {candidate.bio && (
                                                            <p className="text-sm text-muted-foreground">{candidate.bio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {voteData?.type === "poll" && voteData.options && (
                                voteData.subtype === "single" ? (
                                    <RadioGroup value={selectedOptions[0] || ""} className="space-y-3">
                                        {voteData.options.map((option) => (
                                            <Card
                                                key={option._id}
                                                className={`cursor-pointer ${
                                                    selectedOptions[0] === option._id ? "border-primary" : ""
                                                }`}
                                                onClick={() => handleOptionSelect(option._id)}
                                            >
                                                <CardContent className="p-4 flex items-start space-x-3">
                                                    <RadioGroupItem value={option._id} id={option._id} />
                                                    <div>
                                                        <Label htmlFor={option._id} className="text-base font-medium">
                                                            {option.text}
                                                        </Label>
                                                        {option.description && (
                                                            <p className="text-sm text-muted-foreground">{option.description}</p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="space-y-3">
                                        {voteData.options.map((option) => (
                                            <Card
                                                key={option._id}
                                                className={`cursor-pointer ${
                                                    selectedOptions.includes(option._id) ? "border-primary" : ""
                                                }`}
                                                onClick={() => handleOptionSelect(option._id)}
                                            >
                                                <CardContent className="p-4 flex items-start space-x-3">
                                                    <Checkbox
                                                        checked={selectedOptions.includes(option._id)}
                                                        id={option._id}
                                                    />
                                                    <div>
                                                        <Label htmlFor={option._id} className="text-base font-medium">
                                                            {option.text}
                                                        </Label>
                                                        {option.description && (
                                                            <p className="text-sm text-muted-foreground">{option.description}</p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="pt-4">
                    {!blockchainTxHash && (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitVote} disabled={selectedOptions.length === 0 || submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : isBlockchainSession ? (
                                    "Submit Blockchain Vote"
                                ) : (
                                    "Submit Vote"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
