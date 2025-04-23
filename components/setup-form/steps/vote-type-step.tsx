"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/shadcn-ui/radio-group"
import { Label } from "@/components/shadcn-ui/label"
import { BarChart2, Award, Trophy, Crown, Check, Users, ListFilter } from "lucide-react"
import { ProFeatureBadge } from "@/components/shadcn-ui/pro-feature-badge"

interface VoteTypeStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
}

export function VoteTypeStep({ formState, updateFormState }: VoteTypeStepProps) {
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Vote Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Poll Type */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              formState.type === "poll" ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleTypeChange("poll")}
          >
            <CardHeader className="pb-2">
              <BarChart2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Poll</CardTitle>
              <CardDescription>Simple voting mechanism</CardDescription>
            </CardHeader>
            <CardContent>
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
            <CardHeader className="pb-2">
              <Award className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Election</CardTitle>
              <CardDescription>Candidate-based voting system</CardDescription>
            </CardHeader>
            <CardContent>
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
            className={`cursor-pointer transition-all hover:border-primary relative ${
              formState.type === "tournament" ? "border-2 border-primary" : ""
            } ${!isPro ? "opacity-80" : ""}`}
            onClick={() => isPro && handleTypeChange("tournament")}
          >
            <CardHeader className="pb-2">
              <Trophy className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Tournament</CardTitle>
              <CardDescription>Competitive elimination format</CardDescription>
            </CardHeader>
            <CardContent>
              {!isPro && <ProFeatureBadge />}
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
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
          <RadioGroup
            value={formState.subtype}
            onValueChange={handleSubtypeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="Single Elimination" id="single-elim" className="peer sr-only" />
              <Label
                htmlFor="single-elim"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Trophy className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Single Elimination</p>
                  <p className="text-sm text-muted-foreground">Lose once and you're out</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="Double Elimination" id="double-elim" className="peer sr-only" />
              <Label
                htmlFor="double-elim"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Award className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Double Elimination</p>
                  <p className="text-sm text-muted-foreground">Lose twice before elimination</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>
    </div>
  )
}
