"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { BarChart2, Award, Trophy, Crown, Check, Users, ListFilter } from "lucide-react"
import { ProFeatureBadge } from "@/components/ui/pro-feature-badge"

interface VoteTypeStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  errors?: Record<string, string>
}

export function VoteTypeStep({ formState, updateFormState, errors }: VoteTypeStepProps) {
  const handleTypeChange = (value: "poll" | "election" | "tournament") => {
    // Reset subtype when changing type
    let newSubtype: any = "Single"

    if (value === "tournament") {
      newSubtype = "Single Elimination"
    }

    updateFormState({
      type: value,
      subtype: newSubtype,
    })
  }

  const handleSubtypeChange = (value: string) => {
    updateFormState({ subtype: value as any })
  }

  const isPro = formState.subscription.name === "pro" || formState.subscription.name === "enterprise"

  return (
    <div className="space-y-8">
      {errors?.type && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/30">
          {errors.type}
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Vote Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Poll Type */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              formState.type === "poll" ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleTypeChange("poll")}
          >
            <CardHeader className="pb-2 p-4">
              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <BarChart2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary sm:mb-2" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Poll</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Simple voting mechanism</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              {formState.type === "poll" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Election Type */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary relative ${
              formState.type === "election" ? "border-2 border-primary" : ""
            } ${!isPro ? "opacity-80" : ""}`}
            onClick={() => isPro && handleTypeChange("election")}
          >
            <CardHeader className="pb-2 p-4">
              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary sm:mb-2" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Election</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Candidate-based voting system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              {!isPro && <ProFeatureBadge />}
              {formState.type === "election" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tournament Type */}
          <Card
            className={`cursor-not-allowed transition-all hover:border-none relative bg-muted/30 border border-dashed ${
              formState.type === "tournament" ? "border-2 border-primary" : ""
            }`}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-950 text-xs font-bold px-3 py-1 rounded-full">
              Coming Soon
            </div>
            <CardHeader className="pb-2 p-4">
              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60 sm:mb-2" />
                <div>
                  <CardTitle className="text-base sm:text-lg text-muted-foreground">Tournament</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Competitive elimination format</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              {formState.type === "tournament" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Voting Mode Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Voting Mode</h3>

        {formState.type === "poll" && (
          <RadioGroup
            value={formState.subtype}
            onValueChange={handleSubtypeChange}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="Single" id="single" className="peer sr-only" />
              <Label
                htmlFor="single"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Check className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Single Choice</p>
                  <p className="text-sm text-muted-foreground">Voters select one option</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="Multiple" id="multiple" className="peer sr-only" />
              <Label
                htmlFor="multiple"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Users className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Multiple Choice</p>
                  <p className="text-sm text-muted-foreground">Voters select multiple options</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="Ranked" id="ranked" className="peer sr-only" />
              <Label
                htmlFor="ranked"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <ListFilter className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Ranked Choice</p>
                  <p className="text-sm text-muted-foreground">Voters rank options by preference</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        )}

        {formState.type === "election" && (
          <RadioGroup
            value={formState.subtype}
            onValueChange={handleSubtypeChange}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="Single" id="single-election" className="peer sr-only" />
              <Label
                htmlFor="single-election"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Crown className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Single Choice</p>
                  <p className="text-sm text-muted-foreground">Voters select one candidate</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="Multiple" id="multiple-election" className="peer sr-only" />
              <Label
                htmlFor="multiple-election"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Users className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Multiple Choice</p>
                  <p className="text-sm text-muted-foreground">Voters select multiple candidates</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="Ranked" id="ranked-election" className="peer sr-only" />
              <Label
                htmlFor="ranked-election"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <ListFilter className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Ranked Choice</p>
                  <p className="text-sm text-muted-foreground">Voters rank candidates by preference</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        )}

        {formState.type === "tournament" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
              <p className="text-center text-muted-foreground">
                Tournament functionality is coming soon. Please select Poll or Election for now.
              </p>
            </div>
            <RadioGroup
              value={formState.subtype}
              onValueChange={handleSubtypeChange}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50"
              disabled
            >
              <div>
                <RadioGroupItem value="Single Elimination" id="single-elim" className="peer sr-only" disabled />
                <Label
                  htmlFor="single-elim"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-not-allowed"
                >
                  <Trophy className="mb-3 h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium text-muted-foreground">Single Elimination</p>
                    <p className="text-sm text-muted-foreground">Lose once and you're out</p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="Double Elimination" id="double-elim" className="peer sr-only" disabled />
                <Label
                  htmlFor="double-elim"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-not-allowed"
                >
                  <Award className="mb-3 h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium text-muted-foreground">Double Elimination</p>
                    <p className="text-sm text-muted-foreground">Second chance after first loss</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  )
}
