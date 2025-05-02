"use client"

import { useState } from "react"
import type { SessionData } from "./vote-session-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Button } from "@/components/shadcn-ui/button"
import { Eye, EyeOff, RefreshCw, Edit, Save, X, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SessionSettingsProps {
  sessionData: SessionData
  editData: SessionData
  isEditing: boolean
  isActive: boolean
  hasProFeatures: boolean
  onUpdate: (data: Partial<SessionData>) => void
  onChange: (field: keyof SessionData, value: any) => void
}

export function SessionSettings({ 
  sessionData, 
  editData, 
  isEditing, 
  isActive,
  hasProFeatures,
  onUpdate, 
  onChange 
}: SessionSettingsProps) {
  const [showSecretPhrase, setShowSecretPhrase] = useState(false)

  const handleChange = (field: keyof SessionData, value: any) => {
    onChange(field, value);
  }

  const generateSecretPhrase = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleChange("secretPhrase", result)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Session Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Result Visibility</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.resultVisibility === "Public"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("resultVisibility", "Public")}
            >
              <div className="font-medium mb-1">Public</div>
              <div className="text-xs text-muted-foreground">Results visible to everyone</div>
            </div>
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.resultVisibility === "Private"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("resultVisibility", "Private")}
            >
              <div className="font-medium mb-1">Private</div>
              <div className="text-xs text-muted-foreground">Results visible to admins only</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Verification Method</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.verificationMethod === "Standard"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("verificationMethod", "Standard")}
            >
              <div className="font-medium mb-1">Standard</div>
              <div className="text-xs text-muted-foreground">Basic email verification</div>
            </div>
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.verificationMethod === "KYC"
                  ? "border-primary bg-primary/5"
                  : isEditing && hasProFeatures
                    ? "hover:border-muted-foreground"
                    : "opacity-50"
              }`}
              onClick={() => isEditing && hasProFeatures && handleChange("verificationMethod", "KYC")}
            >
              <div className="font-medium mb-1">KYC</div>
              <div className="text-xs text-muted-foreground">
                Advanced identity verification
                {!hasProFeatures && <span className="block mt-1 text-yellow-500">Pro Plan Feature</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Access Level</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.accessLevel === "Public"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("accessLevel", "Public")}
            >
              <div className="font-medium mb-1">Public</div>
              <div className="text-xs text-muted-foreground">Anyone can participate</div>
            </div>
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                editData.accessLevel === "Private"
                  ? "border-primary bg-primary/5"
                  : isEditing && hasProFeatures
                    ? "hover:border-muted-foreground"
                    : "opacity-50"
              }`}
              onClick={() => isEditing && hasProFeatures && handleChange("accessLevel", "Private")}
            >
              <div className="font-medium mb-1">Private</div>
              <div className="text-xs text-muted-foreground">
                Restricted access
                {!hasProFeatures && <div className="mt-1 text-yellow-500">Pro Plan Feature</div>}
              </div>
            </div>
          </div>
        </div>

        {(editData.accessLevel === "Private" || sessionData.accessLevel === "Private") && hasProFeatures && (
          <div className="space-y-3">
            <Label>Private Access Methods</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  editData.secretPhrase
                    ? "border-primary bg-primary/5"
                    : isEditing
                      ? "hover:border-muted-foreground"
                      : ""
                }`}
                onClick={() => isEditing && !editData.secretPhrase && generateSecretPhrase()}
              >
                <div className="font-medium mb-2 text-center">Secret Phrase</div>
                {editData.secretPhrase && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="secretPhrase" className="text-xs">
                        Phrase
                      </Label>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowSecretPhrase(!showSecretPhrase)
                          }}
                        >
                          {showSecretPhrase ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              generateSecretPhrase()
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <Input
                        id="secretPhrase"
                        type={showSecretPhrase ? "text" : "password"}
                        value={editData.secretPhrase}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleChange("secretPhrase", e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs h-8"
                      />
                    ) : (
                      <div className="text-xs font-mono bg-muted p-1.5 rounded-md">
                        {showSecretPhrase ? editData.secretPhrase : "••••••••••••••••"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  editData.csvEmailFiltering
                    ? "border-primary bg-primary/5"
                    : isEditing && hasProFeatures
                      ? "hover:border-muted-foreground"
                      : "opacity-50"
                }`}
                onClick={() => isEditing && hasProFeatures && handleChange("csvEmailFiltering", !editData.csvEmailFiltering)}
              >
                <div className="font-medium mb-2 text-center">CSV Email Filtering</div>
                <div className="text-xs text-muted-foreground text-center">
                  Restrict access to specific emails
                </div>
                {editData.csvEmailFiltering && hasProFeatures && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 w-full"
                      disabled={!isEditing}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle CSV upload
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {isEditing ? "Upload CSV" : "CSV Uploaded"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(editData.accessLevel === "Private" || sessionData.accessLevel === "Private") && !hasProFeatures && (
          <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-center space-y-2 mt-4">
            <div className="font-medium text-yellow-700 dark:text-yellow-400">Pro Plan Required</div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Private access features require a Pro plan subscription. Upgrade to access Secret Phrase and CSV Email Filtering.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
