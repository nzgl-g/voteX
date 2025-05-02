"use client"

import type React from "react"

import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Label } from "@/components/shadcn-ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/shadcn-ui/radio-group"
import { Input } from "@/components/shadcn-ui/input"
import { Globe, Lock, Key, FileText, Check } from "lucide-react"
import { ProFeatureBadge } from "@/components/shadcn-ui/pro-feature-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Button } from "@/components/shadcn-ui/button"

interface AccessControlStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
}

export function AccessControlStep({ formState, updateFormState }: AccessControlStepProps) {

  const handleAccessLevelChange = (value: "public" | "private") => {
    updateFormState({
      accessLevel: value,
      securityMethod: value === "private" ? "secret phrase" : null,
    })
  }

  const handleSecurityMethodChange = (value: "secret phrase" | "csv") => {
    updateFormState({ securityMethod: value })
  }

  const handleSecretPhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormState({ secretPhrase: e.target.value })
  }

  const isPro = formState.subscription.name === "pro" || formState.subscription.name === "enterprise"

  return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Access Control</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Public Access */}
            <Card
                className={`cursor-pointer transition-all hover:border-primary ${
                    formState.accessLevel === "public" ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleAccessLevelChange("public")}
            >
              <CardHeader className="pb-2 p-4">
                <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary sm:mb-2" />
                  <div>
                    <CardTitle className="text-base sm:text-lg">Public Session</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Anyone can access this session</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                {formState.accessLevel === "public" && (
                    <div className="h-6 flex items-center justify-end">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Private Access */}
            <Card
                className={`cursor-pointer transition-all hover:border-primary relative ${
                    formState.accessLevel === "private" ? "border-2 border-primary" : ""
                } ${!isPro ? "opacity-80" : ""}`}
                onClick={() => isPro && handleAccessLevelChange("private")}
            >
              <CardHeader className="pb-2 p-4">
                <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary sm:mb-2" />
                  <div>
                    <CardTitle className="text-base sm:text-lg">Private Session</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Access restricted to specific users</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                {!isPro && <ProFeatureBadge />}
                {formState.accessLevel === "private" && (
                    <div className="h-6 flex items-center justify-end">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Method (only for Private sessions) */}
        {formState.accessLevel === "private" && (
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-medium">Security Method</h3>
              <RadioGroup
                  value={formState.securityMethod || ""}
                  onValueChange={(value) => handleSecurityMethodChange(value as "secret phrase" | "csv")}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="secret phrase" id="secret-phrase" className="peer sr-only" />
                  <Label
                      htmlFor="secret-phrase"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Key className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Secret Phrase</p>
                      <p className="text-sm text-muted-foreground">Protect with a password</p>
                    </div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="csv" id="area-restriction" className="peer sr-only" />
                  <Label
                      htmlFor="area-restriction"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <FileText className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">User Filtering</p>
                      <p className="text-sm text-muted-foreground">Upload a CSV with allowed users</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Secret Phrase Input */}
              {formState.securityMethod === "secret phrase" && (
                  <div className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="secret-phrase-input">Secret Phrase</Label>
                      <Input
                          id="secret-phrase-input"
                          type="text"
                          placeholder="Enter a secret phrase"
                          value={formState.secretPhrase || ""}
                          onChange={handleSecretPhraseChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        This phrase will be required to access the voting session
                      </p>
                    </div>
                  </div>
              )}

              {/* CSV Upload */}
              {formState.securityMethod === "csv" && (
                  <div className="pt-4">
                    <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                        <TabsTrigger value="template">CSV Template</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="pt-4">
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="text-center text-muted-foreground mb-2">Drag and drop your CSV file here</p>
                            <p className="text-xs text-center text-muted-foreground mb-4">
                              CSV should contain email addresses of allowed voters
                            </p>
                            <Button variant="outline" className="mt-2">
                              Browse files
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="template" className="pt-4">
                        <Card>
                          <CardContent className="p-6">
                            <h4 className="font-medium mb-2">CSV Template Format</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Your CSV file should have the following columns:
                            </p>
                            <div className="bg-muted p-3 rounded-md mb-4 font-mono text-sm">Full Name,dob(yyyy month dd),email</div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
              )}
            </div>
        )}
      </div>
  )
}