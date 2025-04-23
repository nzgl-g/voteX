"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { BarChart, Clock, Check } from "lucide-react"

interface ResultsDisplayStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
}

export function ResultsDisplayStep({ formState, updateFormState }: ResultsDisplayStepProps) {
  const handleResultsDisplayChange = (value: "real-time" | "post-completion") => {
    updateFormState({ resultsDisplay: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Results Display</h3>
        <p className="text-muted-foreground">Choose when voting results will be visible to participants</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Real-time Results */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              formState.resultsDisplay === "real-time" ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleResultsDisplayChange("real-time")}
          >
            <CardHeader className="pb-2">
              <BarChart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-time</CardTitle>
              <CardDescription>Results visible during voting period</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Live updates as votes come in</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Transparent voting process</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Immediate feedback for participants</span>
                </li>
              </ul>
              {formState.resultsDisplay === "real-time" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post-completion Results */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              formState.resultsDisplay === "post-completion" ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleResultsDisplayChange("post-completion")}
          >
            <CardHeader className="pb-2">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Post-completion</CardTitle>
              <CardDescription>Results only shown after session ends</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Prevents strategic voting</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Reduces bias in voting decisions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Creates anticipation for results</span>
                </li>
              </ul>
              {formState.resultsDisplay === "post-completion" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
