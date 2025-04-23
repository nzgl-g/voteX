"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Card, CardContent } from "@/components/shadcn-ui/card"
import type { SessionFormState } from "@/components/setup-form/vote-session-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { ImageIcon, Upload } from "lucide-react"

// Update the BasicInformationStep props interface to include errors
interface BasicInformationStepProps {
  formState: SessionFormState
  updateFormState: (newState: Partial<SessionFormState>) => void
  errors?: Record<string, string>
}

export function BasicInformationStep({ formState, updateFormState, errors = {} }: BasicInformationStepProps) {
  const [titleCharCount, setTitleCharCount] = useState(formState.name?.length || 0)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleCharCount(e.target.value.length)
    updateFormState({ name: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormState({ description: e.target.value })
  }

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormState({ organizationName: e.target.value })
  }

  // Update the banner selection functionality
  const handleBannerSelect = (url: string) => {
    updateFormState({ banner: url })
  }

  // Add a function to handle custom banner upload
  const handleCustomBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload this file to a server
      // For now, we'll create a local URL
      const url = URL.createObjectURL(file)
      updateFormState({ banner: url })
    }
  }

  // Sample banner images
  const bannerOptions = [
    "/placeholder.svg?height=315&width=851",
    "/placeholder.svg?height=315&width=851",
    "/placeholder.svg?height=315&width=851",
    "/placeholder.svg?height=315&width=851",
    "/placeholder.svg?height=315&width=851",
    "/placeholder.svg?height=315&width=851",
  ]

  // Update the JSX to show error messages and improve banner selection
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formState.name || ""}
          onChange={handleTitleChange}
          placeholder="Enter a title for your vote session"
          required
          className={`w-full ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        <div className="text-xs text-muted-foreground text-right">{titleCharCount}/100 characters</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formState.description || ""}
          onChange={handleDescriptionChange}
          placeholder="Provide details about this vote session"
          required
          className={`min-h-[120px] w-full ${errors.description ? "border-red-500" : ""}`}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization" className="text-base font-medium">
          Organization Name <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="organization"
          value={formState.organizationName || ""}
          onChange={handleOrganizationChange}
          placeholder="Enter your organization name"
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Banner</Label>

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Select from library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bannerOptions.map((url, index) => (
                <Card
                  key={index}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    formState.banner === url ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleBannerSelect(url)}
                >
                  <CardContent className="p-0">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Banner option ${index + 1}`}
                      className="w-full h-auto aspect-[851/315] object-cover"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-2">Drag and drop your banner image here</p>
                <p className="text-xs text-center text-muted-foreground mb-4">
                  Same dimensions as Facebook cover photo - 851×315 pixels
                </p>
                <label htmlFor="banner-upload" className="cursor-pointer">
                  <div className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm">Browse files</div>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomBannerUpload}
                  />
                </label>
                {formState.banner && formState.banner !== bannerOptions[0] && formState.banner !== bannerOptions[1] && (
                  <div className="mt-4 w-full">
                    <p className="text-sm mb-2">Selected banner:</p>
                    <img
                      src={formState.banner || "/placeholder.svg"}
                      alt="Custom banner"
                      className="w-full h-auto aspect-[851/315] object-cover rounded-md"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
