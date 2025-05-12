"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Vote, AlertCircle, ThumbsUp, Rocket, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import blockchainService from '@/services/blockchain-service';
import { toast } from '@/lib/toast';

export type VoteType = "poll" | "elections"
export type VoteMode = "single" | "multiple" | "ranked"

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
    voteType: VoteType
    voteMode: VoteMode
    kyc?: boolean
    maxSelections?: number
    options?: VotingOption[]
    candidates?: Candidate[]
    contractAddress?: string
    onSubmit: (data: any) => void
}

export function VotingDialog({
                                 open,
                                 onOpenChange,
                                 voteType,
                                 voteMode,
    kyc = false,
                                 maxSelections = 1,
                                 options = [],
                                 candidates = [],
    contractAddress,
    onSubmit
                             }: VotingDialogProps) {
    // For single selection
    const [selectedOption, setSelectedOption] = useState<string>('');
    
    // For multiple selection
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    
    // For ranked selection
    const [rankingMap, setRankingMap] = useState<Record<string, number>>({});
    
    // For blockchain integration
    const [isBlockchainVoting, setIsBlockchainVoting] = useState<boolean>(!!contractAddress);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isVoting, setIsVoting] = useState<boolean>(false);
    const [walletConnected, setWalletConnected] = useState<boolean>(false);
    
    // Determine items to display based on vote type
    const items = voteType === 'poll' ? options : candidates;
    
    useEffect(() => {
        // Reset state when dialog opens
        if (open) {
            setSelectedOption('');
            setSelectedOptions([]);
            setRankingMap({});
            setWalletAddress(null);
            setWalletConnected(false);
            
            // Check if we need blockchain voting
            setIsBlockchainVoting(!!contractAddress);
            
            // If user already has MetaMask connected, check it
            if (contractAddress && typeof window !== 'undefined' && window.ethereum) {
                checkWalletConnection();
            }
        }
    }, [open, contractAddress]);
    
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
        if (blockchainService.isConnected()) {
            setWalletAddress(blockchainService.getWalletAddress());
            setWalletConnected(true);
        }
    };
    
    // Connect to MetaMask wallet
    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            const connected = await blockchainService.connect();
            
            if (connected) {
                setWalletAddress(blockchainService.getWalletAddress());
                setWalletConnected(true);
                toast({
                    title: "Wallet Connected",
                    description: "Your wallet is now connected and ready to vote.",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Connection Failed",
                    description: "Could not connect to MetaMask. Please make sure it's installed and unlocked.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            toast({
                title: "Connection Error",
                description: "There was an error connecting to your wallet.",
                variant: "destructive"
            });
        } finally {
            setIsConnecting(false);
        }
    };
    
    // Handle checkbox change for multiple selections
    const handleCheckboxChange = (id: string, checked: boolean) => {
        if (checked) {
            // Prevent selecting more than maxSelections
            if (selectedOptions.length >= maxSelections) {
                toast({
                    title: "Selection Limit",
                    description: `You can only select up to ${maxSelections} options.`,
                    variant: "default"
                });
                return;
            }
            setSelectedOptions([...selectedOptions, id]);
        } else {
            setSelectedOptions(selectedOptions.filter(item => item !== id));
        }
    };
    
    // Handle rank change for ranked voting
    const handleRankChange = (id: string, rank: number) => {
        // Check if this rank is already assigned
        const existingItemWithRank = Object.entries(rankingMap).find(
            ([itemId, itemRank]) => itemRank === rank && itemId !== id
        );
        
        // If rank already used, swap the items
        if (existingItemWithRank) {
            const [existingId] = existingItemWithRank;
            setRankingMap(prev => ({
                ...prev,
                [id]: rank,
                [existingId]: prev[id] || 0
            }));
        } else {
            // Otherwise just set the rank
            setRankingMap(prev => ({
                ...prev,
                [id]: rank
            }));
        }
    };
    
    // Handle submission
    const handleSubmit = async () => {
        let selections;
        
        // Format data based on vote mode
        if (voteMode === 'single') {
            selections = selectedOption;
        } else if (voteMode === 'multiple') {
            selections = selectedOptions;
        } else if (voteMode === 'ranked') {
            selections = rankingMap;
        }
        
        // Validate selection
        if (!validateSelection(selections)) {
            return;
        }
        
        // If this is a blockchain vote, handle it differently
        if (isBlockchainVoting && contractAddress) {
            await handleBlockchainVote(selections);
        } else {
            // Regular API vote
            onSubmit({ selections });
        }
    };
    
    // Validate that a proper selection was made
    const validateSelection = (selections: any): boolean => {
        if (voteMode === 'single' && !selections) {
            toast({
                title: "Selection Required",
                description: "Please select an option to vote.",
                variant: "destructive"
            });
            return false;
        }
        
        if (voteMode === 'multiple' && (!selections || selections.length === 0)) {
            toast({
                title: "Selection Required",
                description: "Please select at least one option to vote.",
                variant: "destructive"
            });
            return false;
        }
        
        if (voteMode === 'ranked') {
            const rankCount = Object.keys(selections).length;
            if (rankCount === 0) {
                toast({
                    title: "Ranking Required",
                    description: "Please rank at least one option to vote.",
                    variant: "destructive"
                });
                return false;
            }
        }
        
        return true;
    };
    
    // Handle blockchain voting
    const handleBlockchainVote = async (selections: any) => {
        if (!contractAddress || !walletConnected) {
            toast({
                title: "Wallet Required",
                description: "Please connect your wallet first.",
                variant: "destructive"
            });
            return;
        }
        
        try {
            setIsVoting(true);
            
            // Format the choices and ranks for the blockchain
            let choices: string[] = [];
            let ranks: number[] = [];
            
            if (voteMode === 'single') {
                choices = [selections];
            } else if (voteMode === 'multiple') {
                choices = selections;
            } else if (voteMode === 'ranked') {
                // Convert ranking map to parallel arrays of choices and ranks
                const sortedEntries = Object.entries(selections)
                    .sort((a, b) => a[1] - b[1]) // sort by rank
                    .filter(([_, rank]) => rank > 0); // filter out unranked
                    
                choices = sortedEntries.map(([id]) => id);
                ranks = sortedEntries.map(([_, rank]) => rank);
            }
            
            // Cast vote on blockchain
            const txHash = await blockchainService.castVote(
                contractAddress,
                choices,
                voteMode === 'ranked' ? ranks : []
            );
            
            toast({
                title: "Vote Cast Successfully",
                description: "Your vote has been recorded on the blockchain.",
                variant: "default"
            });
            
            // Close dialog and notify parent
            onOpenChange(false);
            onSubmit({ selections, txHash });
        } catch (error: any) {
            console.error("Blockchain voting error:", error);
            toast({
                title: "Voting Error",
                description: error.message || "Failed to cast your vote on the blockchain.",
                variant: "destructive"
            });
        } finally {
            setIsVoting(false);
        }
    };
    
    // Render blockchain connection UI if needed
    if (isBlockchainVoting && !walletConnected) {
    return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Rocket className="mr-2 h-5 w-5" />
                            Connect Your Wallet to Vote
                        </DialogTitle>
                        <DialogDescription>
                            This voting session is on the blockchain. Connect your wallet to continue.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Blockchain Voting</AlertTitle>
                            <AlertDescription>
                                Your vote will be recorded on the Ethereum blockchain, ensuring transparency and security.
                            </AlertDescription>
                        </Alert>
                        
                        <p className="text-sm text-muted-foreground mb-2">Requirements:</p>
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-4">
                            <li>MetaMask or compatible wallet extension</li>
                            <li>Small amount of ETH for transaction gas</li>
                            <li>One-time transaction approval</li>
                        </ul>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex justify-center">
                            <Button 
                                onClick={connectWallet} 
                                disabled={isConnecting}
                                size="lg"
                                className="px-6"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Connect Wallet to Vote
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Vote className="mr-2 h-5 w-5" />
                        Cast Your Vote
                    </DialogTitle>
                    <DialogDescription>
                        {voteType === 'poll' ? 'Select your preferred option(s)' : 'Vote for your preferred candidate(s)'}
                    </DialogDescription>
                </DialogHeader>
                
                {isBlockchainVoting && walletConnected && (
                    <Alert>
                        <ThumbsUp className="h-4 w-4" />
                        <AlertTitle>Wallet Connected</AlertTitle>
                        <AlertDescription className="text-xs">
                            {walletAddress ? (
                                <span>Your vote will be cast from: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                            ) : (
                                <span>Your wallet is connected and ready to vote.</span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                
                {kyc && (
                    <Alert variant="warning" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>KYC Required</AlertTitle>
                        <AlertDescription>
                            Your identity will be verified when casting your vote.
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="py-4">
                    {voteMode === 'single' && (
                        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 mb-3 pb-3 border-b">
                                    <RadioGroupItem value={item.id} id={`radio-${item.id}`} />
                                    <Label htmlFor={`radio-${item.id}`} className="flex-1 cursor-pointer">
                                        <div className="font-medium">{item.title}</div>
                                        {(item.description || item.biography) && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {item.description || item.biography}
                                            </div>
                                        )}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                    
                    {voteMode === 'multiple' && (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-2 mb-3 pb-3 border-b">
                                    <Checkbox 
                                        id={`checkbox-${item.id}`} 
                                        checked={selectedOptions.includes(item.id)}
                                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked === true)} 
                                        className="mt-1"
                                    />
                                    <Label htmlFor={`checkbox-${item.id}`} className="flex-1 cursor-pointer">
                                        <div className="font-medium">{item.title}</div>
                                        {(item.description || item.biography) && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {item.description || item.biography}
                                    </div>
                                    )}
                                    </Label>
                                </div>
                            ))}
                            <p className="text-sm text-muted-foreground">
                                {selectedOptions.length} of {maxSelections} options selected
                            </p>
                        </div>
                    )}
                    
                    {voteMode === 'ranked' && (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 mb-3 pb-3 border-b">
                                    <Label htmlFor={`rank-${item.id}`} className="flex-1">
                                        <div className="font-medium">{item.title}</div>
                                        {(item.description || item.biography) && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {item.description || item.biography}
                    </div>
                                        )}
                                    </Label>
                                    <Input
                                        id={`rank-${item.id}`}
                                        type="number"
                                        min="1"
                                        max={items.length}
                                        value={rankingMap[item.id] || ''}
                                        onChange={(e) => handleRankChange(item.id, parseInt(e.target.value) || 0)}
                                        className="w-16 text-center"
                                        placeholder="#"
                                    />
                                </div>
                            ))}
                            <p className="text-sm text-muted-foreground">
                                Rank your choices from 1 (highest) to {items.length} (lowest)
                            </p>
                        </div>
                        )}
                    </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isVoting}>
                        Cancel
                            </Button>
                    <Button onClick={handleSubmit} disabled={isVoting}>
                        {isVoting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Cast Vote'
                        )}
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
    );
}
