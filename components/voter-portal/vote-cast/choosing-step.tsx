"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { VoteType, VoteMode, VotingOption, Candidate } from "./voting-dialog"
import { Check, ChevronRight } from "lucide-react"

interface VotingStepProps {
    items: (VotingOption | Candidate)[]
    voteType: VoteType
    voteMode: VoteMode
    selections: string[]
    rankings: Record<string, number>
    maxSelections: number
    onSelectionChange: (id: string) => void
}

export function VotingStep({
                               items,
                               voteType,
                               voteMode,
                               selections,
                               rankings,
                               maxSelections,
                               onSelectionChange,
                           }: VotingStepProps) {
    const getSelectionText = () => {
        if (voteMode === "single") {
            return "Select one option"
        } else if (voteMode === "multiple") {
            return `Select up to ${maxSelections} options`
        } else {
            return `Rank up to ${maxSelections} options`
        }
    }

    const isSelected = (id: string) => {
        if (voteMode === "ranked") {
            return id in rankings
        }
        return selections.includes(id)
    }

    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-medium">{voteType === "poll" ? "Poll Options" : "Election Candidates"}</h3>
                <p className="text-sm text-gray-500">{getSelectionText()}</p>
                {voteMode === "multiple" && (
                    <p className="text-sm font-medium mt-1">
                        Selected: {selections.length}/{maxSelections}
                    </p>
                )}
                {voteMode === "ranked" && (
                    <p className="text-sm font-medium mt-1">
                        Ranked: {Object.keys(rankings).length}/{maxSelections}
                    </p>
                )}
            </div>

            <div className="space-y-4 p-6">
                {items.map((item) => (
                    <Card
                        key={item.id}
                        className={`transition-all ${
                            isSelected(item.id) ? "border-primary ring-2 ring-primary ring-opacity-50" : "hover:border-gray-300"
                        }`}
                    >
                        <CardHeader className="relative pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                {isSelected(item.id) && (
                                    <div className="flex items-center">
                                        {voteMode === "ranked" ? (
                                            <Badge variant="default" className="ml-2">
                                                Rank {rankings[item.id]}
                                            </Badge>
                                        ) : (
                                            <Badge variant="default" className="ml-2">
                                                <Check className="h-3 w-3 mr-1" /> Selected
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            <CardDescription>{voteType === "elections" ? "Candidate" : "Option"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm line-clamp-2">
                                {voteType === "elections" ? (item as Candidate).biography : (item as VotingOption).description}
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                            {voteType === "elections" && (
                                <Button variant="outline" size="sm" className="w-full mr-2">
                                    Show Details
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            )}
                            <Button
                                variant={isSelected(item.id) ? "default" : "secondary"}
                                size="sm"
                                className="w-full"
                                onClick={() => onSelectionChange(item.id)}
                            >
                                {isSelected(item.id) ? (voteMode === "ranked" ? `Ranked #${rankings[item.id]}` : "Selected") : "Select"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
