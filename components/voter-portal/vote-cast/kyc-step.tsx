"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KYCData as OriginalKYCData } from "./voting-dialog"
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/lib/toast"
import { userService, User } from "@/services/user-service"

interface KYCFormProps {
  onSubmit: (data: OriginalKYCData) => void
  isVerifying: boolean
  verificationError?: {
    decision?: string;
    reason?: string;
    details?: any;
  }
}

export function KYCForm({ onSubmit, isVerifying, verificationError }: KYCFormProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<OriginalKYCData>({
    fullName: "",
    nationality: "",
    dateOfBirth: "",
    idCardNumber: "",
    idCardDocument: null,
  })
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      console.log('[KYCStep] Attempting to fetch user data...');
      setIsLoadingUser(true)
      try {
        const user = await userService.getCurrentUser()
        console.log('[KYCStep] User data fetched successfully:', user)
        setCurrentUser(user)
        setFormData((prev) => ({
          ...prev,
          fullName: user.fullName || "",
          nationality: user.nationality || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        }))
        console.log('[KYCStep] formData after setting user data:', {
          fullName: user.fullName || "",
          nationality: user.nationality || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        })
      } catch (error) {
        console.error("[KYCStep] Failed to fetch user data in useEffect:", error)
        setErrors((prev) => ({ ...prev, userFetch: "Failed to load user data. Check console for details." }))
      } finally {
        setIsLoadingUser(false)
        console.log('[KYCStep] Finished fetching user data (finally block).')
      }
    }
    fetchUser()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "idCardNumber") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, idCardDocument: e.target.files![0] }))
      if (errors.idCardDocument) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.idCardDocument
          return newErrors
        })
      }
    }
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
      setFormData((prev) => ({ ...prev, idCardDocument: e.dataTransfer.files[0] }))
      if (errors.idCardDocument) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.idCardDocument
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) {
        newErrors.fullName = "Full name is missing. Please ensure your profile is complete.";
    }
    if (!formData.nationality) {
        newErrors.nationality = "Nationality is missing. Please ensure your profile is complete.";
    }
    if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is missing. Please ensure your profile is complete.";
    }

    if (!formData.idCardNumber.trim()) {
      newErrors.idCardNumber = "ID card number is required"
    }

    if (!formData.idCardDocument) {
      newErrors.idCardDocument = "ID card document is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const submissionData: OriginalKYCData = {
        fullName: formData.fullName,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth,
        idCardNumber: formData.idCardNumber,
        idCardDocument: formData.idCardDocument,
      };

      console.log('[KYCStep] Submitting verification data:', {
        ...submissionData,
        idCardDocument: submissionData.idCardDocument ? 
          `File: ${submissionData.idCardDocument.name} (${Math.round(submissionData.idCardDocument.size / 1024)} KB)` : 
          'No file'
      });

      if (typeof toast !== 'undefined') {
        toast({
          title: "Submitting verification",
          description: "Please wait while we verify your identity...",
        });
      }

      onSubmit(submissionData)
    }
  }

  const VerificationSuccess = () => (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 flex items-start">
      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
      <div>
        <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
        <p className="text-sm text-green-700 mt-1">
          Your identity has been verified. You can now proceed to vote.
        </p>
      </div>
    </div>
  );

  const VerificationError = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
      <div>
        <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
    </div>
  );

  // Extract the pure text from the reason, handling JSON if needed
  const extractReason = (text?: string): string => {
    if (!text) return "";
    
    // Case 1: Check for exact format with backticks
    if (text.includes('```json') && text.includes('```')) {
      try {
        // Extract everything between the backticks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonStr = jsonMatch[1].trim();
          const parsedObj = JSON.parse(jsonStr);
          return parsedObj.reason || "";
        }
      } catch (e) {
        console.error("Failed to parse JSON from code block format", e);
      }
    }
    
    // Case 2: Try to parse as direct JSON
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const parsedObj = JSON.parse(text);
        if (parsedObj.reason) {
          return parsedObj.reason;
        }
      } catch (e) {
        console.error("Failed to parse as direct JSON", e);
      }
    }
    
    // Case 3: Extract with regex if it has JSON-like structure
    if (text.includes('"reason"')) {
      const reasonMatch = text.match(/"reason"\s*:\s*"([^"]+)"/);
      if (reasonMatch && reasonMatch[1]) {
        return reasonMatch[1];
      }
    }
    
    // Case 4: Use the text directly if no JSON structure is found
    // First clean any code markers
    return text.replace(/```json|```/g, '').trim();
  };

  const DetailedVerificationError = ({ error }: { error: NonNullable<KYCFormProps['verificationError']> }) => {    
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex items-start mb-3">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
          </div>
        </div>
        
        <div className="mt-3 border-t border-red-200 pt-3">
          <div className="mb-3">
            <p className="text-sm font-medium text-red-800">KYC Decision:</p>
            <p className="text-sm text-red-700 mt-1">{error.decision || "deny"}</p>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-medium text-red-800">Reason:</p>
            <p className="text-sm text-red-700 mt-1">{extractReason(error.reason)}</p>
          </div>
          
          <p className="text-xs text-red-800 mt-3">
            Please try again with a clearer image of your ID document.
          </p>
        </div>
      </div>
    );
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user information...</p>
      </div>
    )
  }

  if (errors.userFetch) {
    return (
      <div className="p-4">
        <VerificationError message={errors.userFetch} />
        <p className="text-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mx-auto"
          >
            Try Again
          </Button>
        </p>
      </div>
    );
  }
  
  if (!currentUser?.fullName || !currentUser?.nationality || !currentUser?.dateOfBirth) {
    return (
        <div className="p-4 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-amber-800">Profile Incomplete</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Please complete your full name, nationality, and date of birth in your user profile before proceeding with KYC.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/profile'}
              className="mt-2"
            >
              Go to Profile
            </Button>
        </div>
    );
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      {verificationError && (
        verificationError.decision === "accept" ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-start mb-3">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
              </div>
            </div>
            
            <div className="mt-3 border-t border-green-200 pt-3">
              <div className="mb-3">
                <p className="text-sm font-medium text-green-800">KYC Status:</p>
                <p className="text-sm text-green-700 mt-1">Accepted</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-green-800">Details:</p>
                <p className="text-sm text-green-700 mt-1">{extractReason(verificationError.reason) || "Your identity has been verified successfully"}</p>
              </div>
              
              <p className="text-xs text-green-800 mt-3">
                You will be automatically redirected to the voting screen in a moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-start mb-3">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
              </div>
            </div>
            
            <div className="mt-3 border-t border-red-200 pt-3">
              <div className="mb-3">
                <p className="text-sm font-medium text-red-800">KYC Status:</p>
                <p className="text-sm text-red-700 mt-1">Rejected</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-red-800">Reason:</p>
                <p className="text-sm text-red-700 mt-1">{extractReason(verificationError.reason) || "Verification could not be completed"}</p>
              </div>
              
              <p className="text-xs text-red-800 mt-3">
                Please try again with a clearer image of your ID document. Make sure all text is readable and the entire document is visible.
              </p>
            </div>
          </div>
        )
      )}
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          readOnly
          className="bg-gray-100"
        />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nationality">Nationality</Label>
        <Input
          id="nationality"
          name="nationality"
          value={formData.nationality}
          readOnly
          className="bg-gray-100"
        />
        {errors.nationality && <p className="text-sm text-red-500">{errors.nationality}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          readOnly
          className="bg-gray-100"
        />
        {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="idCardNumber">ID Card Number</Label>
        <Input
          id="idCardNumber"
          name="idCardNumber"
          value={formData.idCardNumber}
          onChange={handleChange}
          className={errors.idCardNumber ? "border-red-500" : ""}
        />
        {errors.idCardNumber && <p className="text-sm text-red-500">{errors.idCardNumber}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="idCardDocument">ID Card Document</Label>
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center ${
            dragActive ? "border-primary bg-primary/10" : "border-gray-300"
          } ${errors.idCardDocument ? "border-red-500" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="idCardDocument"
            name="idCardDocument"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-gray-500" />
            <p className="text-sm font-medium">
              {formData.idCardDocument
                ? `Selected: ${formData.idCardDocument.name}`
                : "Drag and drop your ID card document here, or click to select"}
            </p>
            <p className="text-xs text-gray-500">Supports: JPG, PNG, PDF (max 5MB)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("idCardDocument")?.click()}
            >
              Select File
            </Button>
          </div>
        </div>
        {errors.idCardDocument && <p className="text-sm text-red-500">{errors.idCardDocument}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isVerifying || isLoadingUser}>
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
          </>
        ) : (
          "Verify"
        )}
      </Button>
    </form>
  )
}
