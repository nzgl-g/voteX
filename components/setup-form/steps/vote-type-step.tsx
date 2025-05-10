"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { BarChart2, Award, Trophy, Crown, Check, Users, ListFilter } from "lucide-react"
import { ProFeatureBadge } from "@/components/ui/pro-feature-badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface VoteTypeStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  errors?: Record<string, string>
}

export function VoteTypeStep({ formState, updateFormState, errors = {} }: VoteTypeStepProps) {
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
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2">Choose Vote Type</h3>
        <p className="text-muted-foreground">Select the type of voting session you want to create.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formState.type}
            onValueChange={(value) => updateFormState({ type: value as SessionFormState["type"] })}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="poll" id="poll" className="peer sr-only" />
              <Label
                htmlFor="poll"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Poll
                <span className="text-sm text-muted-foreground">Simple voting with options</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="election" id="election" className="peer sr-only" />
              <Label
                htmlFor="election"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Election
                <span className="text-sm text-muted-foreground">Vote for candidates</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="tournament" id="tournament" className="peer sr-only" />
              <Label
                htmlFor="tournament"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-6 w-6"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                Tournament
                <span className="text-sm text-muted-foreground">Competitive voting with rounds</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voting Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtype">Voting Mode</Label>
                <Select
                  value={formState.subtype}
                  onValueChange={(value) => updateFormState({ subtype: value as SessionFormState["subtype"] })}
                >
                  <SelectTrigger id="subtype">
                    <SelectValue placeholder="Select voting mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {formState.type === "poll" && (
                      <>
                        <SelectItem value="Single">Single Choice</SelectItem>
                        <SelectItem value="multiple">Multiple Choice</SelectItem>
                        <SelectItem value="ranked">Ranked Choice</SelectItem>
                      </>
                    )}
                    {formState.type === "election" && (
                      <>
                        <SelectItem value="Single">Single Vote</SelectItem>
                        <SelectItem value="multiple">Multiple Votes</SelectItem>
                        <SelectItem value="ranked">Ranked Voting</SelectItem>
                      </>
                    )}
                    {formState.type === "tournament" && (
                      <>
                        <SelectItem value="single elimination">Single Elimination</SelectItem>
                        <SelectItem value="double elimination">Double Elimination</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formState.type === "tournament" && (
                <div className="space-y-2">
                  <Label htmlFor="tournamentType">Tournament Type</Label>
                  <Select
                    value={formState.tournamentType || ""}
                    onValueChange={(value) => updateFormState({ tournamentType: value as SessionFormState["tournamentType"] })}
                  >
                    <SelectTrigger id="tournamentType">
                      <SelectValue placeholder="Select tournament type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round Robin">Round Robin</SelectItem>
                      <SelectItem value="knockout">Knockout</SelectItem>
                      <SelectItem value="swiss">Swiss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Add maxChoices input for poll and election types */}
            {(formState.type === "poll" || formState.type === "election") && (
              <div className="space-y-2">
                <Label htmlFor="maxChoices">Maximum Choices</Label>
                <Input
                  id="maxChoices"
                  type="number"
                  min="1"
                  value={formState.maxChoices}
                  onChange={(e) => updateFormState({ maxChoices: parseInt(e.target.value) })}
                  placeholder="Enter maximum number of choices"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of options a voter can select
                </p>
              </div>
            )}

            {/* Add maxRounds input for tournament type */}
            {formState.type === "tournament" && (
              <div className="space-y-2">
                <Label htmlFor="maxRounds">Maximum Rounds</Label>
                <Input
                  id="maxRounds"
                  type="number"
                  min="1"
                  value={formState.maxRounds}
                  onChange={(e) => updateFormState({ maxRounds: parseInt(e.target.value) })}
                  placeholder="Enter maximum number of rounds"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of rounds in the tournament
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {errors.type && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{errors.type}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
