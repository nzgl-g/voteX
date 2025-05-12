"use client"

import type React from "react"

import { useState } from "react"
import type { FormData } from "../voting-session-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step1Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

const predefinedBanners = [
  "/placeholder.svg?height=200&width=400",
  "/placeholder.svg?height=200&width=400",
  "/placeholder.svg?height=200&width=400",
  "/placeholder.svg?height=200&width=400",
]

export default function Step1BasicInfo({ formData, updateFormData }: Step1Props) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof formData.banner === "string" ? formData.banner : null,
  )

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      alert("Please select an image file (.jpg or .png)")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB")
      return
    }

    updateFormData({ banner: file })
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const selectPredefinedBanner = (url: string) => {
    updateFormData({ banner: url })
    setPreviewUrl(url)
  }

  const clearBanner = () => {
    updateFormData({ banner: null })
    setPreviewUrl(null)
    if (typeof formData.banner === "object" && formData.banner !== null) {
      URL.revokeObjectURL(previewUrl!)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Basic Session Information</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-base">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Enter a clear, descriptive title for your voting session"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">A concise title helps voters understand what they're voting for</p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-base">
              Description <span className="text-red-500">*</span>
            </Label>
            <span className={`text-sm ${formData.description.length > 200 ? "text-red-500" : "text-gray-500"}`}>
              {formData.description.length}/200
            </span>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Provide details about the purpose and context of this voting session"
            className="mt-1 min-h-[100px]"
          />
          <p className="text-sm text-gray-500 mt-1">
            A good description provides context and helps voters make informed decisions
          </p>
        </div>

        <div>
          <Label htmlFor="organization" className="text-base">
            Organization Name
          </Label>
          <Input
            id="organization"
            value={formData.organization}
            onChange={(e) => updateFormData({ organization: e.target.value })}
            placeholder="Enter your organization's name (optional)"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">Adding your organization name builds trust with voters</p>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <Label className="text-base mr-2">Banner Image</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Adding a banner image increases engagement and makes your voting session more visually appealing
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {previewUrl ? (
            <div className="relative mt-2 rounded-lg overflow-hidden">
              <img src={previewUrl || "/placeholder.svg"} alt="Banner preview" className="w-full h-48 object-cover" />
              <button
                onClick={clearBanner}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  dragActive
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-300 hover:border-purple-400 dark:border-gray-600",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop an image, or click to select
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 5MB</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg, image/png"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Or choose from our gallery:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {predefinedBanners.map((banner, index) => (
                    <div
                      key={index}
                      className={cn(
                        "cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                        formData.banner === banner
                          ? "border-purple-500 ring-2 ring-purple-300"
                          : "border-transparent hover:border-purple-300",
                      )}
                      onClick={() => selectPredefinedBanner(banner)}
                    >
                      <img
                        src={banner || "/placeholder.svg"}
                        alt={`Predefined banner ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
