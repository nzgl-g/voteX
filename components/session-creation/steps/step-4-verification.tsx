"use client"

import type { FormData } from "../voting-session-form"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Mail, CreditCard, Lock, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step4Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  subscription: "free" | "pro"
}

export default function Step4Verification({ formData, updateFormData, subscription }: Step4Props) {
  const handleVerificationSelect = (type: "standard" | "kyc") => {
    if (type === "kyc" && subscription !== "pro") return // Pro feature
    updateFormData({ verificationType: type })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Voter Verification</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-gray-400" />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="max-w-xs">
                Verification helps ensure the integrity of your voting session by confirming voter identities
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Verification */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.verificationType === "standard"
              ? "border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20"
              : "hover:border-teal-200",
          )}
          onClick={() => handleVerificationSelect("standard")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Mail className="h-10 w-10 text-teal-500 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Standard Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Email-based verification</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Voters receive a unique link via email</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">One vote per verified email address</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Simple setup with no additional configuration</p>
              </div>
            </div>

            <Badge className="mt-4 self-start bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-200">
              Available for all plans
            </Badge>

            {formData.verificationType === "standard" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-teal-500" />
            )}
          </div>
        </Card>

        {/* KYC Verification */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.verificationType === "kyc"
              ? "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : subscription === "pro"
                ? "hover:border-purple-200"
                : "opacity-70",
          )}
          onClick={() => handleVerificationSelect("kyc")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <CreditCard className="h-10 w-10 text-purple-500 mr-3" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">KYC Verification</h3>
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    Pro
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">ID-based verification</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Voters verify identity with government-issued ID</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Enhanced security for high-stakes voting</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Prevents duplicate voting with biometric checks</p>
              </div>
            </div>

            <Badge className="mt-4 self-start bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200">
              Pro feature
            </Badge>

            {formData.verificationType === "kyc" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-purple-500" />
            )}

            {subscription !== "pro" && <Lock className="absolute top-4 right-4 h-6 w-6 text-gray-400" />}
          </div>
        </Card>
      </div>

      {formData.verificationType === "standard" && (
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg mt-4 animate-in fade-in duration-300">
          <h3 className="font-medium mb-2 flex items-center">
            <Info size={16} className="mr-2 text-teal-600" />
            Standard Verification Process
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Voters will receive an email with a unique, secure link to access the voting session. Each link can only be
            used once, ensuring one vote per verified email address.
          </p>
        </div>
      )}

      {formData.verificationType === "kyc" && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mt-4 animate-in fade-in duration-300">
          <h3 className="font-medium mb-2 flex items-center">
            <Info size={16} className="mr-2 text-purple-600" />
            KYC Verification Process
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Voters will go through a secure identity verification process using government-issued ID. This provides the
            highest level of security and prevents duplicate voting.
          </p>
        </div>
      )}
    </div>
  )
}
