"use client"

import type { FormData } from "../voting-session-form"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Lock, CheckCircle2, Vote, Award, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step2Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  subscription: "free" | "pro"
}

export default function Step2VotingType({ formData, updateFormData, subscription }: Step2Props) {
  const handleVoteTypeSelect = (type: "poll" | "election" | "tournament") => {
    if (type === "tournament") return // Disabled
    if (type === "election" && subscription !== "pro") return // Pro feature

    updateFormData({ voteType: type })
  }

  const handleVotingModeSelect = (mode: "single" | "multiple") => {
    updateFormData({ votingMode: mode })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Voting Type & Mode</h2>

      <div className="space-y-6">
        <div>
          <Label className="text-base mb-3 block">Select Voting Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Poll Card */}
            <Card
              className={cn(
                "relative p-5 cursor-pointer transition-all hover:shadow-md",
                formData.voteType === "poll"
                  ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "hover:border-green-200",
              )}
              onClick={() => handleVoteTypeSelect("poll")}
            >
              <div className="flex flex-col items-center text-center">
                <Vote className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-bold text-lg mb-1">Poll</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Simple voting for quick decisions and opinion gathering
                </p>
                {formData.voteType === "poll" && (
                  <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-green-500" />
                )}
              </div>
            </Card>

            {/* Election Card */}
            <Card
              className={cn(
                "relative p-5 cursor-pointer transition-all hover:shadow-md",
                formData.voteType === "election"
                  ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : subscription === "pro"
                    ? "hover:border-blue-200"
                    : "opacity-70",
              )}
              onClick={() => handleVoteTypeSelect("election")}
            >
              <div className="flex flex-col items-center text-center">
                <Award className="h-12 w-12 text-blue-500 mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Election</h3>
                  {subscription !== "pro" && (
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      Pro
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Formal voting with nomination phase and advanced options
                </p>
                {formData.voteType === "election" && (
                  <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-blue-500" />
                )}
                {subscription !== "pro" && <Lock className="absolute top-3 right-3 h-5 w-5 text-gray-400" />}
              </div>
            </Card>

            {/* Tournament Card */}
            <Card className="relative p-5 cursor-not-allowed opacity-70">
              <div className="flex flex-col items-center text-center">
                <Trophy className="h-12 w-12 text-amber-500 mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Tournament</h3>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Bracket-style competition with multiple rounds
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="absolute inset-0">
                    <span className="sr-only">Coming soon</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tournament mode is coming soon!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Card>
          </div>
        </div>

        {(formData.voteType === "poll" || formData.voteType === "election") && (
          <div className="animate-in fade-in duration-300">
            <Label className="text-base mb-3 block">Select Voting Mode</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Single Choice */}
              <Card
                className={cn(
                  "p-5 cursor-pointer transition-all hover:shadow-md",
                  formData.votingMode === "single"
                    ? "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "hover:border-purple-200",
                )}
                onClick={() => handleVotingModeSelect("single")}
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-bold text-lg mb-2">Single Choice</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                    Voters select exactly one option from the available choices
                  </p>
                  {formData.votingMode === "single" && (
                    <CheckCircle2 className="h-5 w-5 text-purple-500 mt-3 self-end" />
                  )}
                </div>
              </Card>

              {/* Multiple Choice */}
              <Card
                className={cn(
                  "p-5 cursor-pointer transition-all hover:shadow-md",
                  formData.votingMode === "multiple"
                    ? "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "hover:border-purple-200",
                )}
                onClick={() => handleVotingModeSelect("multiple")}
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-bold text-lg mb-2">Multiple Choices</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Voters can select multiple options up to a maximum limit
                  </p>

                  {formData.votingMode === "multiple" && (
                    <div className="mt-auto">
                      <Label htmlFor="maxSelections" className="text-sm">
                        Maximum selections allowed:
                      </Label>
                      <Input
                        id="maxSelections"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.maxSelections}
                        onChange={(e) => {
                          // Only allow positive integer inputs
                          const inputValue = e.target.value;
                          
                          // Allow empty input temporarily for better UX while typing
                          if (inputValue === '') {
                            return;
                          }
                          
                          // Ensure input is a positive integer
                          const value = parseInt(inputValue, 10);
                          if (!isNaN(value) && value > 0 && Number.isInteger(value)) {
                            updateFormData({ maxSelections: value });
                          }
                        }}
                        onBlur={(e) => {
                          // When focus leaves the input, ensure we have a valid positive integer
                          const value = parseInt(e.target.value, 10);
                          if (e.target.value === '' || isNaN(value) || value <= 0 || !Number.isInteger(value)) {
                            // Reset to current valid value or default to 1
                            e.target.value = String(formData.maxSelections || 1);
                            updateFormData({ maxSelections: formData.maxSelections || 1 });
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {formData.votingMode === "multiple" && (
                    <CheckCircle2 className="h-5 w-5 text-purple-500 mt-3 self-end" />
                  )}
                </div>
              </Card>

              {/* Ranked Choice option removed */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
