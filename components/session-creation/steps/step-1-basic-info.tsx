"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { FormData } from "../voting-session-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import CloudinaryUploader from "@/components/cloudinary-uploader"
import BannerGallery from "../banner-gallery"

interface Step1Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

// Updated predefined banners with voting-themed Cloudinary URLs
const predefinedBanners = [
  "https://res.cloudinary.com/dxh0qathv/image/upload/v1748278383/Capture_d_%C3%A9cran_2025-05-26_174913_bprgte.png",
  "https://res.cloudinary.com/dxh0qathv/image/upload/v1748278381/Capture_d_%C3%A9cran_2025-05-26_175107_x4j5tq.png",
  "https://res.cloudinary.com/dxh0qathv/image/upload/v1748278382/Capture_d_%C3%A9cran_2025-05-26_175157_snturd.png",
  "https://res.cloudinary.com/dxh0qathv/image/upload/v1748278382/Capture_d_%C3%A9cran_2025-05-26_174836_epakfk.png",
]

export default function Step1BasicInfo({ formData, updateFormData }: Step1Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof formData.banner === "string" ? formData.banner : null,
  )

  // Handle image uploaded from Cloudinary
  const handleImageUploaded = (url: string) => {
    updateFormData({ banner: url })
    setPreviewUrl(url)
  }

  // Clear banner image
  const clearBanner = () => {
    updateFormData({ banner: null })
    setPreviewUrl(null)
  }

  // Select predefined banner
  const selectPredefinedBanner = (url: string) => {
    updateFormData({ banner: url })
    setPreviewUrl(url)
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
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Choose a banner image to make your voting session stand out. You can upload your own image or select from our gallery.
            </p>
            
            <CloudinaryUploader 
              previewUrl={previewUrl}
              onImageUploaded={handleImageUploaded}
              onClear={clearBanner}
            />

            <BannerGallery 
              banners={predefinedBanners}
              selectedBanner={previewUrl}
              onSelect={selectPredefinedBanner}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
