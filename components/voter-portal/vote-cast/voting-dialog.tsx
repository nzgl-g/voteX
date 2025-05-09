"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { KYCForm } from "./kyc-step"
import { VotingStep } from "./choosing-step"
import { ConfirmationDialog } from "./confirmation-dialog"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"

export type VoteType = "poll" | "elections"
export type VoteMode = "single" | "multiple" | "ranked"

export interface VotingOption {
    id: string
    title: string
    description: string
}

export interface Candidate {
    id: string
    title: string
    biography: string
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
    kyc: boolean
    maxSelections?: number
    options?: VotingOption[]
    candidates?: Candidate[]
    onSubmit: (data: {
        kycData?: KYCData
        selections: string[] | Record<string, number>
    }) => Promise<void>
}

export function VotingDialog({
                                 open,
                                 onOpenChange,
                                 voteType,
                                 voteMode,
                                 kyc,
                                 maxSelections = 1,
                                 options = [],
                                 candidates = [],
                                 onSubmit,
                             }: VotingDialogProps) {
    const [step, setStep] = useState(1)
    const [kycData, setKycData] = useState<KYCData | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [selections, setSelections] = useState<string[]>([])
    const [rankings, setRankings] = useState<Record<string, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)

    const totalSteps = kyc ? 2 : 1
    const items = voteType === "poll" ? options : candidates

    const handleKYCSubmit = async (data: KYCData) => {
        setIsVerifying(true)
        // Simulate KYC verification
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setKycData(data)
        setIsVerifying(false)
        setStep(2)
    }

    const handleSelectionChange = (id: string) => {
        if (voteMode === "single") {
            setSelections([id])
        } else if (voteMode === "multiple") {
            if (selections.includes(id)) {
                setSelections(selections.filter((selectionId) => selectionId !== id))
            } else if (selections.length < maxSelections) {
                setSelections([...selections, id])
            }
        } else if (voteMode === "ranked") {
            if (id in rankings) {
                // Remove the ranking
                const newRankings = { ...rankings }
                delete newRankings[id]

                // Reorder remaining rankings
                const reorderedRankings: Record<string, number> = {}
                Object.entries(newRankings)
                    .sort((a, b) => a[1] - b[1])
                    .forEach(([key, _], index) => {
                        reorderedRankings[key] = index + 1
                    })

                setRankings(reorderedRankings)
            } else if (Object.keys(rankings).length < maxSelections) {
                // Add new ranking
                setRankings({
                    ...rankings,
                    [id]: Object.keys(rankings).length + 1,
                })
            }
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleProceedToConfirmation = () => {
        setShowConfirmation(true)
    }

    const handleCancelConfirmation = () => {
        setShowConfirmation(false)
    }

    const handleFinalSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onSubmit({
                kycData: kyc ? kycData! : undefined,
                selections: voteMode === "ranked" ? rankings : selections,
            })
            setShowConfirmation(false)
            onOpenChange(false)
            // Reset state
            setStep(1)
            setKycData(null)
            setSelections([])
            setRankings({})
        } catch (error) {
            console.error("Error submitting vote:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isNextDisabled = () => {
        if (step === 1 && kyc && !kycData) return true
        if (step === totalSteps) {
            if (voteMode === "ranked") return Object.keys(rankings).length === 0
            return selections.length === 0
        }
        return false
    }

    const getDialogTitle = () => {
        if (step === 1 && kyc) return "KYC Verification"
        return voteType === "poll" ? "Vote on Poll" : "Vote in Elections"
    }

    return (
        <>
            <Dialog
                open={open && !showConfirmation}
                onOpenChange={(newOpen) => {
                    if (!newOpen) {
                        setShowConfirmation(false)
                    }
                    onOpenChange(newOpen)
                }}
            >
                <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center">
                            {Array.from({ length: totalSteps }).map((_, index) => (
                                <div key={index} className="flex items-center">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                            step > index + 1
                                                ? "bg-green-500 text-white"
                                                : step === index + 1
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-200 text-gray-500"
                                        }`}
                                    >
                                        {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                                    </div>
                                    {index < totalSteps - 1 && (
                                        <div className={`w-12 h-1 ${step > index + 1 ? "bg-green-500" : "bg-gray-200"}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-1 flex-1">
                        {step === 1 && kyc ? (
                            <KYCForm onSubmit={handleKYCSubmit} isVerifying={isVerifying} />
                        ) : (
                            <VotingStep
                                items={items}
                                voteType={voteType}
                                voteMode={voteMode}
                                selections={selections}
                                rankings={rankings}
                                maxSelections={maxSelections}
                                onSelectionChange={handleSelectionChange}
                            />
                        )}
                    </div>

                    <div className="flex justify-between mt-6 pt-4 border-t">
                        {step > 1 && (
                            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        )}
                        {step === 1 && !kyc ? (
                            <Button
                                onClick={handleProceedToConfirmation}
                                disabled={isNextDisabled() || isSubmitting}
                                className="ml-auto"
                            >
                                Submit Vote <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : step < totalSteps ? (
                            <Button onClick={() => setStep(step + 1)} disabled={isNextDisabled() || isVerifying} className="ml-auto">
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleProceedToConfirmation}
                                disabled={isNextDisabled() || isSubmitting}
                                className="ml-auto"
                            >
                                Submit Vote <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                voteType={voteType}
                voteMode={voteMode}
                selections={voteMode === "ranked" ? rankings : selections}
                items={items}
                kycData={kyc ? kycData! : undefined}
                onConfirm={handleFinalSubmit}
                onCancel={handleCancelConfirmation}
            />
        </>
    )
}
