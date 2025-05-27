"use client"

import type React from "react"

import { useState } from "react"
import type { FormData } from "../voting-session-form"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Globe, Lock, CheckCircle2, Info, Upload, RefreshCw, Download, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step5Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

export default function Step5Visibility({ formData, updateFormData }: Step5Props) {
  const [dragActive, setDragActive] = useState(false)
  const [csvPreview, setCsvPreview] = useState<string | null>(null)

  const handleVisibilitySelect = (type: "public" | "private") => {
    updateFormData({ visibility: type })
  }

  const generateSecretPhrase = () => {
    const adjectives = ["happy", "brave", "clever", "mighty", "gentle", "wise", "calm", "bold"]
    const nouns = ["tiger", "mountain", "river", "forest", "eagle", "ocean", "planet", "summit"]
    const numbers = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]

    const secretPhrase = `${adjective}-${noun}-${numbers}`
    updateFormData({ secretPhrase })
  }

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
    // Check if file is a CSV
    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB")
      return
    }

    updateFormData({ csvFile: file })

    // Preview CSV content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvPreview(content)
    }
    reader.readAsText(file)
  }

  const clearCsvFile = () => {
    updateFormData({ csvFile: null })
    setCsvPreview(null)
  }

  const downloadTemplate = () => {
    const csvContent = "Full Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "voters_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Visibility Settings</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-gray-400" />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="max-w-xs">Control who can access and participate in your voting session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Visibility */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.visibility === "public"
              ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
              : "hover:border-green-200",
          )}
          onClick={() => handleVisibilitySelect("public")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Globe className="h-10 w-10 text-green-500 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Public</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Open to all verified users</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Anyone with a verified account can participate</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Ideal for community polls and open elections</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Maximum reach and participation</p>
              </div>
            </div>

            {formData.visibility === "public" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-green-500" />
            )}
          </div>
        </Card>

        {/* Private Visibility */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.visibility === "private"
              ? "border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "hover:border-orange-200",
          )}
          onClick={() => handleVisibilitySelect("private")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Lock className="h-10 w-10 text-orange-500 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Private</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Restricted access</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Only invited participants can access</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Secure for internal or sensitive voting</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Control exactly who can participate</p>
              </div>
            </div>

            {formData.visibility === "private" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-orange-500" />
            )}
          </div>
        </Card>
      </div>

      {formData.visibility === "private" && (
        <div className="space-y-6 border-l-4 border-orange-400 pl-4 py-2 animate-in slide-in-from-left duration-300">
          <div>
            <Label className="text-base mb-3 block">Secret Phrase Protection</Label>
            <div className="flex gap-2">
              <Input
                value={formData.secretPhrase}
                onChange={(e) => updateFormData({ secretPhrase: e.target.value })}
                placeholder="Enter a secret phrase for access"
                className="flex-grow"
              />
              <Button variant="outline" onClick={generateSecretPhrase} className="flex items-center gap-1">
                <RefreshCw size={16} />
                Generate
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Share this phrase with authorized voters to grant them access</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label className="text-base mb-3 block">CSV Upload (Voter List)</Label>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Coming Soon
              </Badge>
            </div>

            {false && formData.csvFile && csvPreview ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3">
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2"
                    >
                      CSV
                    </Badge>
                    <span className="font-medium text-sm">{formData.csvFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearCsvFile} className="h-8 w-8 p-0">
                    <X size={16} />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
                <div className="p-3 max-h-40 overflow-auto bg-white dark:bg-gray-900 font-mono text-xs">
                  {csvPreview.split("\n").map((line, i) => (
                    <div key={i} className="py-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors opacity-60",
                    "border-gray-300 dark:border-gray-600"
                  )}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    CSV upload functionality coming soon
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV format: Full Name, Email</p>
                </div>

                <div className="flex justify-center mt-3">
                  <Button
                    variant="link"
                    size="sm"
                    disabled
                    className="text-gray-400 dark:text-gray-500 flex items-center gap-1 cursor-not-allowed"
                  >
                    <Download size={14} />
                    Download CSV Template
                  </Button>
                </div>
              </>
            )}

            <p className="text-sm text-gray-500 mt-3">
              CSV upload for authorized voters list will be available soon. This feature will allow you to restrict access to only specific individuals.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
