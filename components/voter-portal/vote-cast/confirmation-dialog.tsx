"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Wallet } from "lucide-react"
import type { VoteType, VoteMode, VotingOption, Candidate, KYCData } from "./voting-dialog"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    voteType: VoteType
    voteMode: VoteMode
    selections: string[] | Record<string, number>
    items: (VotingOption | Candidate)[]
    kycData?: KYCData
    onConfirm: () => Promise<void>
    onCancel: () => void
}
interface Window {
    ethereum?: {
        isMetaMask?: boolean
        request: (request: { method: string; params?: any[] }) => Promise<any>
    }
}

export function ConfirmationDialog({
                                       open,
                                       onOpenChange,
                                       voteType,
                                       voteMode,
                                       selections,
                                       items,
                                       kycData,
                                       onConfirm,
                                       onCancel,
                                   }: ConfirmationDialogProps) {
    const [isWalletConnected, setIsWalletConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getSelectedItems = () => {
        if (voteMode === "ranked") {
            const rankings = selections as Record<string, number>
            return Object.entries(rankings)
                .sort((a, b) => a[1] - b[1])
                .map(([id, rank]) => {
                    const item = items.find((item) => item.id === id)
                    return { ...item, rank }
                })
        } else {
            const selectedIds = selections as string[]
            return items.filter((item) => selectedIds.includes(item.id))
        }
    }

    const selectedItems = getSelectedItems()

    const connectWallet = async () => {
        setIsConnecting(true)
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== "undefined") {
                // Request account access
                await window.ethereum.request({ method: "eth_requestAccounts" })
                setIsWalletConnected(true)
            } else {
                alert("MetaMask is not installed. Please install it to continue.")
            }
        } catch (error) {
            console.error("Error connecting to MetaMask:", error)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleConfirm = async () => {
        if (!isWalletConnected) {
            return
        }

        setIsSubmitting(true)
        try {
            await onConfirm()
        } catch (error) {
            console.error("Error submitting vote:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Confirm Your Vote</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto pr-1 flex-1">
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-medium mb-2">{voteType === "poll" ? "Selected Options" : "Selected Candidates"}</h3>
                            <div className="space-y-2">
                                {selectedItems.map((item: any) => (
                                    <Card key={item.id} className="border-primary/20">
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                {voteMode === "ranked" && <p className="text-sm text-muted-foreground">Rank: {item.rank}</p>}
                                            </div>
                                            <Check className="h-5 w-5 text-primary" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Connect Your Wallet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Connect your MetaMask wallet to cast your vote on the blockchain.
                            </p>

                            {isWalletConnected ? (
                                <div className="flex items-center text-green-500 bg-green-50 p-3 rounded-md">
                                    <Check className="h-5 w-5 mr-2" />
                                    <span>Wallet connected successfully</span>
                                </div>
                            ) : (
                                <Button onClick={connectWallet} className="w-full" variant="outline" disabled={isConnecting}>
                                    {isConnecting ? "Connecting..." : "Connect MetaMask"}
                                    <Wallet className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Back
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isWalletConnected || isSubmitting}
                        className={`ml-auto ${isWalletConnected ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                        {isSubmitting ? "Processing..." : "Cast Your Vote"}
                        {isWalletConnected && !isSubmitting && <Check className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
