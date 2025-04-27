"use client"

import { useState } from "react"
import { Input } from "@/components/shadcn-ui/input"
import { Button } from "@/components/shadcn-ui/button"
import { Label } from "@/components/shadcn-ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Switch } from "@/components/shadcn-ui/switch"
import { CheckIcon, EyeIcon, EyeOffIcon, KeyIcon, LockIcon, MapPinIcon, PencilIcon, ShieldIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "@/lib/types"

interface SettingsTabProps {
  session: Session
  onUpdate: (data: Partial<Session>) => void
}

export function SettingsTab({ session, onUpdate }: SettingsTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    accessLevel: session.accessLevel,
    securityMethod: session.securityMethod || null,
    verificationMethod: session.verificationMethod || null,
    secretPhrase: session.secretPhrase || "",
    resultVisibility: "public", // Assuming this is stored somewhere in the session
    cvcFiltering: false, // Assuming this is stored somewhere in the session
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onUpdate({
      accessLevel: formData.accessLevel as "Public" | "Private",
      securityMethod: formData.securityMethod as "Secret Phrase" | "Area Restriction" | null,
      verificationMethod: formData.verificationMethod as "KYC" | "CVC" | null,
      secretPhrase: formData.secretPhrase,
      // Other fields would be updated here if they were part of the Session type
    })

    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      accessLevel: session.accessLevel,
      securityMethod: session.securityMethod || null,
      verificationMethod: session.verificationMethod || null,
      secretPhrase: session.secretPhrase || "",
      resultVisibility: "public",
      cvcFiltering: false,
    })
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Session Settings</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave}>
              <CheckIcon className="h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Result Visibility */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-start mb-4">
            <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              {formData.resultVisibility === "public" ? (
                <EyeIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <EyeOffIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Result Visibility</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Control who can see the results of this session
              </p>
            </div>
          </div>

          {isEditing ? (
            <Select
              value={formData.resultVisibility}
              onValueChange={(value) => handleChange("resultVisibility", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public to voters</SelectItem>
                <SelectItem value="private">Private (Admin only)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-slate-700 dark:text-slate-300 capitalize">
              {formData.resultVisibility === "public" ? "Public to voters" : "Private (Admin only)"}
            </p>
          )}
        </div>

        {/* Verification Method */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-start mb-4">
            <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <ShieldIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Verification Method</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">How voters will be verified before voting</p>
            </div>
          </div>

          {isEditing ? (
            <Select
              value={formData.verificationMethod || "none"}
              onValueChange={(value) => handleChange("verificationMethod", value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select verification method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KYC">KYC (Know Your Customer)</SelectItem>
                <SelectItem value="CVC">CVC (Custom Verification Code)</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-slate-700 dark:text-slate-300">{session.verificationMethod || "None"}</p>
          )}
        </div>

        {/* Access Level */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-start mb-4">
            <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <LockIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Access Level</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Who can access this voting session</p>
            </div>
          </div>

          {isEditing ? (
            <Select value={formData.accessLevel} onValueChange={(value) => handleChange("accessLevel", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-slate-700 dark:text-slate-300">{session.accessLevel}</p>
          )}
        </div>

        {/* Security Method */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-start mb-4">
            <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <KeyIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Security Method</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Additional security for accessing the session
              </p>
            </div>
          </div>

          {isEditing ? (
            <Select
              value={formData.securityMethod || "none"}
              onValueChange={(value) => handleChange("securityMethod", value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select security method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Secret Phrase">Secret Phrase</SelectItem>
                <SelectItem value="Area Restriction">Area Restriction</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-slate-700 dark:text-slate-300">{session.securityMethod || "None"}</p>
          )}
        </div>

        {/* Secret Phrase (conditional) */}
        {(formData.securityMethod === "Secret Phrase" || session.securityMethod === "Secret Phrase") && (
          <div
            className={cn(
              "bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border transition-all duration-200",
              "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            )}
          >
            <div className="flex items-start mb-4">
              <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <KeyIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Secret Phrase</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Phrase required to access the session</p>
              </div>
            </div>

            {isEditing ? (
              <Input
                type="text"
                value={formData.secretPhrase}
                onChange={(e) => handleChange("secretPhrase", e.target.value)}
                placeholder="Enter secret phrase"
                className="w-full"
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300">{session.secretPhrase || "Not set"}</p>
            )}
          </div>
        )}

        {/* CVC Filtering (conditional) */}
        {(formData.verificationMethod === "CVC" || session.verificationMethod === "CVC") && (
          <div
            className={cn(
              "bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border transition-all duration-200",
              "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            )}
          >
            <div className="flex items-start mb-4">
              <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <ShieldIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">CVC Filtering</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Enable additional filtering for CVC codes</p>
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.cvcFiltering}
                  onCheckedChange={(checked) => handleChange("cvcFiltering", checked)}
                  id="cvc-filtering"
                />
                <Label htmlFor="cvc-filtering" className="text-slate-700 dark:text-slate-300">
                  {formData.cvcFiltering ? "Enabled" : "Disabled"}
                </Label>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300">{formData.cvcFiltering ? "Enabled" : "Disabled"}</p>
            )}
          </div>
        )}

        {/* Area Restriction (conditional) */}
        {(formData.securityMethod === "Area Restriction" || session.securityMethod === "Area Restriction") && (
          <div
            className={cn(
              "bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border transition-all duration-200",
              "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            )}
          >
            <div className="flex items-start mb-4">
              <div className="mr-3 mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <MapPinIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Area Restriction</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Restrict voting to specific geographic areas
                </p>
              </div>
            </div>

            <p className="text-slate-700 dark:text-slate-300">Area restrictions configured in separate settings</p>
          </div>
        )}
      </div>
    </div>
  )
}
