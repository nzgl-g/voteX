"use client"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Mail, Shield, Check } from "lucide-react"
import { ProFeatureBadge } from "@/components/shadcn-ui/pro-feature-badge"

interface VerificationStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
}

export function VerificationStep({ formState, updateFormState }: VerificationStepProps) {
  const handleVerificationMethodChange = (value: "standard" | "kyc" | null | undefined) => {
    updateFormState({ verificationMethod: value })
  }

  const isPro = formState.subscription.name === "pro" || formState.subscription.name === "enterprise"

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Verification Method</h3>
        <p className="text-muted-foreground">Choose how voters will verify their identity before voting</p>

        {!isPro && (
          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mb-4 border border-border/50">
            <span className="font-medium">Note:</span> KYC verification is available on Pro and Enterprise plans only.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Standard Verification */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              formState.verificationMethod === "standard" ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleVerificationMethodChange("standard")}
          >
            <CardHeader className="pb-2">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Standard</CardTitle>
              <CardDescription>Email and password verification</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Email verification</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Password protection</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Basic security measures</span>
                </li>
              </ul>
              {formState.verificationMethod === "standard" && (
                <div className="h-6 flex items-center justify-end">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* KYC Verification */}
          <Card
            className={`cursor-pointer transition-all hover:border-primary relative ${
              formState.verificationMethod === "kyc" ? "border-2 border-primary" : ""
            } ${!isPro ? "opacity-80" : ""}`}
            onClick={() => isPro && handleVerificationMethodChange("kyc")}
          >
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>KYC System</CardTitle>
              <CardDescription>AI-powered ID verification</CardDescription>
            </CardHeader>
            <CardContent>
              {!isPro && <ProFeatureBadge />}
              <ul className="text-sm space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>ID document verification</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Facial recognition</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Advanced fraud prevention</span>
                </li>
              </ul>
              {formState.verificationMethod === "kyc" && (
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
