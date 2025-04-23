"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { format } from "date-fns"
import {
  CalendarDays,
  Clock,
  Edit,
  Globe,
  Lock,
  Mail,
  Shield,
  BarChart2,
  Award,
  Trophy,
  Check,
  ListFilter,
  Users,
  UserPlus,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/shadcn-ui/badge"
import { Separator } from "@/components/shadcn-ui/separator"

// Update the SummaryStep props interface to include jumpToStep function
interface SummaryStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  jumpToStep?: (step: number) => void
}

export function SummaryStep({ formState, updateFormState, jumpToStep }: SummaryStepProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    try {
      return format(new Date(dateString), "PPP 'at' p")
    } catch (e) {
      return "Not set"
    }
  }

  const getTypeIcon = () => {
    switch (formState.type) {
      case "poll":
        return <BarChart2 className="h-5 w-5 text-primary" />
      case "election":
        return <Award className="h-5 w-5 text-primary" />
      case "tournament":
        return <Trophy className="h-5 w-5 text-primary" />
      default:
        return <BarChart2 className="h-5 w-5 text-primary" />
    }
  }

  const getSubtypeIcon = () => {
    switch (formState.subtype) {
      case "Single":
        return <Check className="h-5 w-5 text-primary" />
      case "multiple":
        return <Users className="h-5 w-5 text-primary" />
      case "ranked":
        return <ListFilter className="h-5 w-5 text-primary" />
      case "single elimination":
        return <Trophy className="h-5 w-5 text-primary" />
      case "double elimination":
        return <Award className="h-5 w-5 text-primary" />
      default:
        return <Check className="h-5 w-5 text-primary" />
    }
  }

  const getAccessIcon = () => {
    return formState.accessLevel === "public" ? (
      <Globe className="h-5 w-5 text-primary" />
    ) : (
      <Lock className="h-5 w-5 text-primary" />
    )
  }

  const getVerificationIcon = () => {
    return formState.verificationMethod === "kyc" ? (
      <Shield className="h-5 w-5 text-primary" />
    ) : (
      <Mail className="h-5 w-5 text-primary" />
    )
  }

  const getCandidateSetupIcon = () => {
    return formState.candidateStep === "nomination" ? (
      <Users className="h-5 w-5 text-primary" />
    ) : (
      <UserPlus className="h-5 w-5 text-primary" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Summary</h3>
        <p className="text-muted-foreground">Review your vote session configuration before publishing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Basic Information</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(0)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{formState.name || "Untitled Session"}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {formState.description || "No description provided"}
                  </p>
                </div>

                {formState.organizationName && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formState.organizationName}
                    </Badge>
                  </div>
                )}

                {formState.banner && (
                  <div className="mt-2">
                    <img
                      src={formState.banner || "/placeholder.svg"}
                      alt="Session banner"
                      className="w-full h-auto rounded-md object-cover aspect-[851/315]"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vote Type */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vote Type</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(1)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">{getTypeIcon()}</div>
                  <div>
                    <div className="font-medium capitalize">{formState.type}</div>
                    <div className="text-sm text-muted-foreground">{formState.subtype}</div>
                  </div>
                </div>
                <div className="bg-muted/50 p-1.5 rounded-full">{getSubtypeIcon()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Access & Verification</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(3)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full mb-2">{getAccessIcon()}</div>
                  <div className="text-center">
                    <div className="font-medium">{formState.accessLevel}</div>
                    <div className="text-xs text-muted-foreground">
                      {formState.accessLevel === "public" ? "Open to everyone" : "Restricted access"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full mb-2">{getVerificationIcon()}</div>
                  <div className="text-center">
                    <div className="font-medium">
                      {formState.verificationMethod === "kyc" ? "KYC System" : "Standard"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formState.verificationMethod === "kyc" ? "ID verification" : "Email verification"}
                    </div>
                  </div>
                </div>
              </div>

              {formState.accessLevel === "private" && formState.securityMethod && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium">Security Method: {formState.securityMethod}</div>
                  {formState.securityMethod === "secret phrase" && formState.secretPhrase && (
                    <div className="text-xs text-muted-foreground mt-1">Secret phrase: {formState.secretPhrase}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Timeline</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(2)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="relative pl-6 pb-6">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-muted-foreground/20"></div>

                {formState.candidateStep === "nomination" && formState.sessionLifecycle.scheduledAt && (
                  <>
                    <div className="relative mb-4">
                      <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-primary/70 border-4 border-background"></div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Nomination Start</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(formState.sessionLifecycle.scheduledAt?.start)}
                      </div>
                    </div>
                  </>
                )}

                <div className="relative mb-4">
                  <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-primary border-4 border-background"></div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Voting Start</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(formState.sessionLifecycle.startedAt)}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-primary/70 border-4 border-background"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Voting End</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(formState.sessionLifecycle.endedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Results Display</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(5)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {formState.resultsDisplay === "real-time" ? (
                      <BarChart2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Clock className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {formState.resultsDisplay === "real-time" ? "Real-time" : "After completion"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formState.resultsDisplay === "real-time"
                        ? "Results visible during voting"
                        : "Results hidden until voting ends"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Configuration */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {formState.type === "poll"
                    ? "Poll Options"
                    : formState.type === "election"
                      ? "Candidates"
                      : "Participants"}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => jumpToStep && jumpToStep(6)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {(formState.type === "election" || formState.type === "tournament") && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">{getCandidateSetupIcon()}</div>
                    <div>
                      <div className="font-medium">
                        {formState.candidateStep === "nomination" ? "Nomination Period" : "Manual Entry"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formState.candidateStep === "nomination"
                          ? "Participants can nominate candidates"
                          : "Candidates added manually"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formState.type === "poll" && formState.options && formState.options.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">Options ({formState.options.length})</div>
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                    {formState.options.map((option, index) => (
                      <div key={option.id || index} className="p-2 bg-muted/30 rounded-md">
                        <div className="font-medium text-sm">{option.name || `Option ${index + 1}`}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{option.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (formState.type === "election" || formState.type === "tournament") &&
                formState.candidates &&
                formState.candidates.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">
                    {formState.type === "election" ? "Candidates" : "Participants"} ({formState.candidates.length})
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                    {formState.candidates.map((candidate, index) => (
                      <div key={candidate.id || index} className="p-2 bg-muted/30 rounded-md">
                        <div className="font-medium text-sm">{candidate.fullName || `Candidate ${index + 1}`}</div>
                        {candidate.partyName && (
                          <div className="text-xs text-muted-foreground mt-1">{candidate.partyName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>No {formState.type === "poll" ? "options" : "candidates"} added yet</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Subscription Plan</h3>
            <p className="text-sm text-muted-foreground">
              {formState.subscription.name === "free"
                ? "Free Plan"
                : formState.subscription.name === "pro"
                  ? "Pro Plan"
                  : "Enterprise Plan"}
            </p>
          </div>
          <Badge variant={formState.subscription?.name === "free" ? "outline" : "default"}>
            {formState.subscription?.name ? formState.subscription.name.toUpperCase() : "FREE"}
          </Badge>
        </div>
      </div>
    </div>
  )
}
