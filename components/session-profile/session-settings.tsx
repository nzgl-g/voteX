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
  onUpdate: (data: Partial<SessionData>) => void
}

export function SessionSettings({ sessionData, onUpdate }: SessionSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(sessionData)
  const [showSecretPhrase, setShowSecretPhrase] = useState(false)

  const handleChange = (field: keyof SessionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate(formData)
    setIsEditing(false)
    toast({
      title: "Changes saved",
      description: "Session settings have been updated successfully.",
    })
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
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setFormData(sessionData)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Result Visibility</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                formData.resultVisibility === "Public"
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
                formData.resultVisibility === "Private"
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
                formData.verificationMethod === "Standard"
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
                formData.verificationMethod === "KYC"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("verificationMethod", "KYC")}
            >
              <div className="font-medium mb-1">KYC</div>
              <div className="text-xs text-muted-foreground">Advanced identity verification</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Access Level</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                formData.accessLevel === "Public"
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
                formData.accessLevel === "Private"
                  ? "border-primary bg-primary/5"
                  : isEditing
                    ? "hover:border-muted-foreground"
                    : ""
              }`}
              onClick={() => isEditing && handleChange("accessLevel", "Private")}
            >
              <div className="font-medium mb-1">Private</div>
              <div className="text-xs text-muted-foreground">Restricted access</div>
            </div>
          </div>
        </div>

        {(formData.accessLevel === "Private" || sessionData.accessLevel === "Private") && (
          <div className="space-y-3">
            <Label>Private Access Methods</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.secretPhrase
                    ? "border-primary bg-primary/5"
                    : isEditing
                      ? "hover:border-muted-foreground"
                      : ""
                }`}
                onClick={() => isEditing && handleChange("secretPhrase", formData.secretPhrase || "secret-phrase")}
              >
                <div className="font-medium mb-2 text-center">Secret Phrase</div>
                {formData.secretPhrase && (
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
                        value={formData.secretPhrase}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleChange("secretPhrase", e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs h-8"
                      />
                    ) : (
                      <div className="text-xs font-mono bg-muted p-1.5 rounded-md">
                        {showSecretPhrase ? formData.secretPhrase : "••••••••••••••••"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.csvEmailFiltering
                    ? "border-primary bg-primary/5"
                    : isEditing
                      ? "hover:border-muted-foreground"
                      : ""
                }`}
                onClick={() => isEditing && handleChange("csvEmailFiltering", !formData.csvEmailFiltering)}
              >
                <div className="font-medium mb-2 text-center">CSV Email Filtering</div>
                {formData.csvEmailFiltering && (
                  <div className="mt-2 space-y-2">
                    {isEditing ? (
                      <div className="border-2 border-dashed rounded-md p-2 flex flex-col items-center justify-center">
                        <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Upload CSV file</p>
                        <p className="text-[10px] text-muted-foreground">Format: Full Name, Email</p>
                      </div>
                    ) : (
                      <div className="text-xs text-center text-muted-foreground">CSV filtering is enabled</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
