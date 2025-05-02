"use client"

import { useState, useEffect } from "react"
import type { SessionFormState, Option, Candidate } from "@/components/setup-form/vote-session-form"
import { Label } from "@/components/shadcn-ui/label"
import { Input } from "@/components/shadcn-ui/input"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn-ui/card"
import { Plus, Trash2, GripVertical, User, AlertCircle, UserPlus, Users } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn-ui/alert"
import { cn } from "@/lib/utils"

interface SetupConfigurationStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  errors?: Record<string, string>
  jumpToStep?: (step: number) => void
}

export function SetupConfigurationStep({
                                         formState,
                                         updateFormState,
                                         errors = {},
                                         jumpToStep,
                                       }: SetupConfigurationStepProps) {
  const [options, setOptions] = useState<Option[]>(formState.options || [])
  const [candidates, setCandidates] = useState<Candidate[]>(formState.candidates || [])
  const [setupMode, setSetupMode] = useState<"manual" | "nomination">(
      formState.candidateStep === "nomination" ? "nomination" : "manual",
  )

  // Check if nomination period is configured
  const isNominationConfigured = formState.sessionLifecycle.scheduledAt !== null

  // Update setup mode when candidateStep changes
  useEffect(() => {
    setSetupMode(formState.candidateStep === "nomination" ? "nomination" : "manual")
  }, [formState.candidateStep])

  const addOption = () => {
    const newOption: Option = {
      id: uuidv4(),
      name: "",
      description: "",
      totalVotes: 0,
    }

    const updatedOptions = [...options, newOption]
    setOptions(updatedOptions)
    updateFormState({ options: updatedOptions })
  }

  const updateOption = (index: number, field: keyof Option, value: string) => {
    const updatedOptions = [...options]
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    }

    setOptions(updatedOptions)
    updateFormState({ options: updatedOptions })
  }

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index)
    setOptions(updatedOptions)
    updateFormState({ options: updatedOptions })
  }

  const addCandidate = () => {
    const newCandidate: Candidate = {
      id: uuidv4(),
      fullName: "",
      partyName: "",
      status: "pending",
      requiresReview: false,
      totalVotes: 0,
    }

    const updatedCandidates = [...candidates, newCandidate]
    setCandidates(updatedCandidates)
    updateFormState({ candidates: updatedCandidates })
  }

  const updateCandidate = (index: number, field: keyof Candidate, value: string) => {
    const updatedCandidates = [...candidates]
    updatedCandidates[index] = {
      ...updatedCandidates[index],
      [field]: value,
    }

    setCandidates(updatedCandidates)
    updateFormState({ candidates: updatedCandidates })
  }

  const removeCandidate = (index: number) => {
    const updatedCandidates = candidates.filter((_, i) => i !== index)
    setCandidates(updatedCandidates)
    updateFormState({ candidates: updatedCandidates })
  }

  const handleSetupModeChange = (mode: "manual" | "nomination") => {
    setSetupMode(mode)
    updateFormState({
      candidateStep: mode === "nomination" ? "nomination" : "manual",
    })
  }

  return (
      <div className="space-y-8">
        {formState.type === "poll" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Poll Options</h3>
                <Button onClick={addOption} variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add Option
                </Button>
              </div>

              {errors.options && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{errors.options}</div>
              )}

              <div className="space-y-4">
                {options.length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
                        <p className="text-muted-foreground mb-4 text-center">No options added yet</p>
                        <Button onClick={addOption} variant="outline" className="flex items-center gap-1">
                          <Plus className="h-4 w-4" /> Add your first option
                        </Button>
                      </CardContent>
                    </Card>
                )}

                {options.map((option, index) => (
                    <Card key={option.id || index} className="relative">
                      <CardHeader className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move shrink-0" />
                          <span className="font-medium truncate">Option {index + 1}</span>
                        </div>
                        <Button
                            onClick={() => removeOption(index)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`option-name-${index}`}>Option Name</Label>
                          <Input
                              id={`option-name-${index}`}
                              value={option.name}
                              onChange={(e) => updateOption(index, "name", e.target.value)}
                              placeholder="Enter option name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`option-description-${index}`}>Description (optional)</Label>
                          <Textarea
                              id={`option-description-${index}`}
                              value={option.description || ""}
                              onChange={(e) => updateOption(index, "description", e.target.value)}
                              placeholder="Enter option description"
                              className="min-h-[80px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
        )}

        {(formState.type === "election" || formState.type === "tournament") && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {formState.type === "election" ? "Candidates" : "Participants"} Setup
                </h3>
              </div>

              {/* Setup Mode Selection using Cards instead of Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Manual Entry Card */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all",
                        setupMode === "manual"
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "hover:border-muted-foreground/30"
                    )}
                    onClick={() => handleSetupModeChange("manual")}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-full mb-2 sm:mb-0">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Manual Setup</h3>
                      <p className="text-sm text-muted-foreground">
                        Add candidates or participants directly. You control the entire process.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Nomination Period Card */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all",
                        setupMode === "nomination"
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "hover:border-muted-foreground/30",
                        !isNominationConfigured && "opacity-60"
                    )}
                    onClick={() => {
                      if (isNominationConfigured) {
                        handleSetupModeChange("nomination")
                      } else if (jumpToStep) {
                        jumpToStep(2) // Jump to Lifecycle step to configure nomination period
                      }
                    }}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-full mb-2 sm:mb-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Nomination Process</h3>
                      <p className="text-sm text-muted-foreground">
                        Allow users to nominate themselves during a nomination period.
                      </p>
                      {!isNominationConfigured && (
                          <div className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                            <AlertCircle className="h-3 w-3" /> Requires nomination period configuration
                          </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Manual Entry Content */}
              {setupMode === "manual" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-medium">
                          Add {formState.type === "election" ? "Candidates" : "Participants"} Manually
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Enter {formState.type === "election" ? "candidates" : "participants"} information directly
                        </p>
                      </div>
                      <Button onClick={addCandidate} variant="outline" size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Add {formState.type === "election" ? "Candidate" : "Participant"}
                      </Button>
                    </div>

                    {errors.candidates && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                          {errors.candidates}
                        </div>
                    )}

                    <div className="space-y-4">
                      {candidates.length === 0 && (
                          <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                              <p className="text-muted-foreground mb-4">
                                No {formState.type === "election" ? "candidates" : "participants"} added yet
                              </p>
                              <Button onClick={addCandidate} variant="outline" className="flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Add your first{" "}
                                {formState.type === "election" ? "candidate" : "participant"}
                              </Button>
                            </CardContent>
                          </Card>
                      )}

                      {candidates.map((candidate, index) => (
                          <Card key={candidate.id || index} className="relative">
                            <CardHeader className="p-4 flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                                <span className="font-medium">
                          {formState.type === "election" ? "Candidate" : "Participant"} {index + 1}
                        </span>
                              </div>
                              <Button
                                  onClick={() => removeCandidate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`candidate-name-${index}`}>Full Name</Label>
                                <Input
                                    id={`candidate-name-${index}`}
                                    value={candidate.fullName}
                                    onChange={(e) => updateCandidate(index, "fullName", e.target.value)}
                                    placeholder="Enter full name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`candidate-party-${index}`}>
                                  {formState.type === "election" ? "Party Name" : "Team/Group"} (optional)
                                </Label>
                                <Input
                                    id={`candidate-party-${index}`}
                                    value={candidate.partyName}
                                    onChange={(e) => updateCandidate(index, "partyName", e.target.value)}
                                    placeholder={`Enter ${formState.type === "election" ? "party name" : "team/group"}`}
                                />
                              </div>
                              <div className="flex justify-center mt-2">
                                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center cursor-pointer">
                                  <User className="h-12 w-12 text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      ))}
                    </div>
                  </div>
              )}

              {/* Nomination Period Content */}
              {setupMode === "nomination" && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nomination Period</CardTitle>
                        <CardDescription>
                          Allow participants to nominate {formState.type === "election" ? "candidates" : "participants"}{" "}
                          during a specified period
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!isNominationConfigured && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Nomination period not configured</AlertTitle>
                              <AlertDescription>
                                You need to configure the nomination period in the Lifecycle step before enabling nominations.
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-destructive underline"
                                    onClick={() => jumpToStep && jumpToStep(2)}
                                >
                                  Configure now
                                </Button>
                              </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                          <Label>Nomination Requirements</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-2">
                                  <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Basic Information</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Name, contact details, and other basic information
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-2">
                                  <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                    <AlertCircle className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Verification</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Nominees will be verified before appearing on the ballot
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
              )}
            </div>
        )}
      </div>
  )
}