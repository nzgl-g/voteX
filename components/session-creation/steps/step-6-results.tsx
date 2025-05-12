"use client"

import type { FormData } from "../voting-session-form"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, BarChart, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step6Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

export default function Step6Results({ formData, updateFormData }: Step6Props) {
  const handleResultVisibilitySelect = (type: "post-completion" | "real-time") => {
    updateFormData({ resultVisibility: type })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Result Visibility</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-gray-400" />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="max-w-xs">Control when and how voting results are displayed to participants</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Post Completion */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.resultVisibility === "post-completion"
              ? "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "hover:border-indigo-200",
          )}
          onClick={() => handleResultVisibilitySelect("post-completion")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Clock className="h-10 w-10 text-indigo-500 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Post Completion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Results shown after session ends</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Prevents results from influencing voter decisions</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Ideal for formal elections and important decisions</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Results revealed simultaneously to all participants</p>
              </div>
            </div>

            {formData.resultVisibility === "post-completion" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-indigo-500" />
            )}
          </div>
        </Card>

        {/* Real-time */}
        <Card
          className={cn(
            "relative p-6 cursor-pointer transition-all hover:shadow-md",
            formData.resultVisibility === "real-time"
              ? "border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20"
              : "hover:border-pink-200",
          )}
          onClick={() => handleResultVisibilitySelect("real-time")}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <BarChart className="h-10 w-10 text-pink-500 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Real-time</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Live results during voting</p>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Provides immediate feedback on voting trends</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Increases engagement and participation</p>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Great for informal polls and community feedback</p>
              </div>
            </div>

            {formData.resultVisibility === "real-time" && (
              <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-pink-500" />
            )}
          </div>
        </Card>
      </div>

      {formData.resultVisibility === "real-time" && (
        <Alert variant="warning" className="animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            Showing real-time results may influence voter behavior. Participants might be swayed to vote for leading
            options or change their vote based on current results.
          </AlertDescription>
        </Alert>
      )}

      {formData.resultVisibility === "post-completion" && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg animate-in fade-in duration-300">
          <h3 className="font-medium mb-2 flex items-center">
            <Info size={16} className="mr-2 text-indigo-600" />
            Post-Completion Results
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Results will be hidden during the voting period and automatically revealed once the session ends. This
            ensures all votes are cast independently without being influenced by current standings.
          </p>
        </div>
      )}
    </div>
  )
}
