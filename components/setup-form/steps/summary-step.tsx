import { useState } from "react"
import { Check, Edit, Globe, Lock, Calendar, Clock, Users, BarChart2, Award, Trophy, Shield } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SessionFormState } from "@/components/setup-form/vote-session-form"

interface SummaryStepProps {
  formState: SessionFormState
  jumpToStep: (step: number) => void
}

export default function SummaryStep({ formState, jumpToStep }: SummaryStepProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      return format(date, "PPP p")
    } catch (e) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2">Review Your Session</h3>
        <p className="text-muted-foreground">Please review all details before creating your session.</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Basic Information</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(0)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">{formState.name}</h4>
              <p className="text-sm text-muted-foreground">{formState.description}</p>
            </div>
            {formState.organizationName && (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {formState.organizationName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vote Type */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Vote Type</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(1)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center">
                {formState.type === "poll" ? (
                  <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                ) : formState.type === "election" ? (
                  <Award className="h-5 w-5 text-blue-600 mr-2" />
                ) : (
                  <Trophy className="h-5 w-5 text-blue-600 mr-2" />
                )}
                <div>
                  <h4 className="text-sm font-medium">Session Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">{formState.type}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center">
                <div>
                  <h4 className="text-sm font-medium">Voting Method</h4>
                  <p className="text-sm text-muted-foreground capitalize">{formState.subtype}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Session Timeline</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(2)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {formState.candidateStep === "nomination" && formState.sessionLifecycle.scheduledAt && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Nomination Start
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(formState.sessionLifecycle.scheduledAt.start)}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Nomination End
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(formState.sessionLifecycle.scheduledAt.end)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Voting Start
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(formState.sessionLifecycle.startedAt)}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Voting End
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(formState.sessionLifecycle.endedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Access & Security</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(3)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center">
                {formState.accessLevel === "public" ? (
                  <Globe className="h-5 w-5 text-amber-600 mr-2" />
                ) : (
                  <Lock className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <div>
                  <h4 className="text-sm font-medium">Access Level</h4>
                  <p className="text-sm text-muted-foreground capitalize">{formState.accessLevel}</p>
                </div>
              </div>

              {formState.accessLevel === "private" && formState.securityMethod && (
                <div className="mt-3 pt-3 border-t border-muted">
                  <h4 className="text-xs font-medium">Security Method</h4>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{formState.securityMethod}</p>

                  {formState.securityMethod === "secret phrase" && formState.secretPhrase && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">Secret phrase:</span>
                      <span className="bg-muted text-muted-foreground text-xs py-1 px-2 rounded">
                        {formState.secretPhrase}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-amber-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium">Verification Method</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {formState.verificationMethod || "Standard"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Results Display</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(5)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center">
              <div>
                <h4 className="text-sm font-medium">Display Type</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {formState.resultsDisplay === "real-time" ? "Real-time updates" : "After completion"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates or Options */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            {formState.type === "poll" ? "Options" : "Candidates"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => jumpToStep(6)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {formState.type === "poll" && formState.options && formState.options.length > 0 ? (
            <div className="space-y-2">
              {formState.options.map((option, index) => (
                <div key={index} className="bg-muted/30 p-2 rounded-md flex items-center">
                  <span className="text-sm">{option.name}</span>
                </div>
              ))}
            </div>
          ) : formState.candidates && formState.candidates.length > 0 ? (
            <div className="space-y-2">
              {formState.candidates.map((candidate, index) => (
                <div key={index} className="bg-muted/30 p-2 rounded-md flex items-center justify-between">
                  <span className="text-sm">{candidate.fullName}</span>
                  {candidate.partyName && (
                    <span className="text-xs text-muted-foreground">{candidate.partyName}</span>
                  )}
                </div>
              ))}
            </div>
          ) : formState.candidateStep === "nomination" ? (
            <div className="bg-muted/30 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Candidates will be added during the nomination period
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                No {formState.type === "poll" ? "options" : "candidates"} have been added
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Subscription Plan</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <Badge className={`${
                  formState.subscription.name === "free" ? "bg-gray-200 text-gray-800" :
                  formState.subscription.name === "pro" ? "bg-blue-100 text-blue-800" :
                  "bg-purple-100 text-purple-800"
                }`}>
                  {formState.subscription.name?.toUpperCase() || "FREE"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {formState.subscription.name === "free"
                    ? "Basic voting capabilities with limited features"
                    : formState.subscription.name === "pro"
                      ? "Advanced features with increased voting capacity"
                      : "Enterprise-level features with maximum capacity"}
                </p>
              </div>
              {formState.subscription.price && (
                <div className="text-right">
                  <p className="text-lg font-bold">${formState.subscription.price}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}