"use client"

import { useState } from "react"
import type { FormData } from "../voting-session-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ChevronRight, Edit, Calendar, Clock, CheckCircle, Users, Globe, Lock, BarChart } from "lucide-react"

interface Step7Props {
  formData: FormData
  goToStep: (step: number) => void
}

export default function Step8Summary({ formData, goToStep }: Step7Props) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (value: string) => {
    setExpandedSections((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-end">
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Almost Done!
        </Badge>
      </div>

      <p className="text-gray-600 dark:text-gray-300">
        Review your voting session details before creating. You can edit any section by clicking the Edit button.
      </p>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Accordion type="multiple" value={expandedSections} className="w-full">
            {/* Basic Info */}
            <AccordionItem value="basic-info" className="border-b">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger
                  onClick={() => toggleSection("basic-info")}
                  className="py-0 hover:no-underline flex-1"
                >
                  <div className="flex items-center text-left">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Basic Information</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Title, description, organization</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(0)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</h4>
                    <p className="mt-1">{formData.title || "Not specified"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                    <p className="mt-1">{formData.description || "Not specified"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</h4>
                    <p className="mt-1">{formData.organization || "Not specified"}</p>
                  </div>

                  {formData.banner && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Banner</h4>
                      <div className="mt-2 rounded-md overflow-hidden">
                        <img
                          src={
                            typeof formData.banner === "string" ? formData.banner : URL.createObjectURL(formData.banner)
                          }
                          alt="Banner"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Voting Type */}
            <AccordionItem value="voting-type" className="border-b">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger
                  onClick={() => toggleSection("voting-type")}
                  className="py-0 hover:no-underline flex-1"
                >
                  <div className="flex items-center text-left">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Voting Type & Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.voteType === "poll" ? "Poll" : "Election"}, {formData.votingMode} choice
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(1)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voting Type</h4>
                    <p className="mt-1 capitalize">{formData.voteType || "Not specified"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voting Mode</h4>
                    <p className="mt-1 capitalize">{formData.votingMode || "Not specified"}</p>

                    {formData.votingMode === "multiple" && (
                      <p className="text-sm text-gray-500 mt-1">Maximum selections: {formData.maxSelections}</p>
                    )}

                    {formData.votingMode === "ranked" && (
                      <p className="text-sm text-gray-500 mt-1">Maximum ranks: {formData.maxRanks}</p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Lifecycle */}
            <AccordionItem value="lifecycle" className="border-b">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger onClick={() => toggleSection("lifecycle")} className="py-0 hover:no-underline flex-1">
                  <div className="flex items-center text-left">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Session Lifecycle</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.startDate && formData.endDate
                          ? `${format(new Date(formData.startDate), "MMM d")} - ${format(new Date(formData.endDate), "MMM d, yyyy")}`
                          : "Dates not set"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(2)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div className="space-y-4">
                  {formData.voteType === "election" && formData.hasNomination && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nomination Period</h4>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span>
                            {formData.nominationStartDate
                              ? format(new Date(formData.nominationStartDate), "MMM d, yyyy")
                              : "Not set"}
                          </span>
                          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                          <span>
                            {formData.nominationEndDate
                              ? format(new Date(formData.nominationEndDate), "MMM d, yyyy")
                              : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>
                            {formData.nominationStartDate
                              ? format(new Date(formData.nominationStartDate), "h:mm a")
                              : "Not set"}
                          </span>
                          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                          <span>
                            {formData.nominationEndDate
                              ? format(new Date(formData.nominationEndDate), "h:mm a")
                              : "Not set"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-dashed pt-3"></div>
                    </>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {formData.voteType === "poll" ? "Poll" : "Voting"} Period
                    </h4>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <span>
                        {formData.startDate ? format(new Date(formData.startDate), "MMM d, yyyy") : "Not set"}
                      </span>
                      <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                      <span>{formData.endDate ? format(new Date(formData.endDate), "MMM d, yyyy") : "Not set"}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      <span>{formData.startDate ? format(new Date(formData.startDate), "h:mm a") : "Not set"}</span>
                      <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                      <span>{formData.endDate ? format(new Date(formData.endDate), "h:mm a") : "Not set"}</span>
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        Duration:{" "}
                        {Math.ceil(
                          (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </Badge>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Verification */}
            <AccordionItem value="verification" className="border-b">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger
                  onClick={() => toggleSection("verification")}
                  className="py-0 hover:no-underline flex-1"
                >
                  <div className="flex items-center text-left">
                    <div className="bg-teal-100 dark:bg-teal-900 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Voter Verification</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.verificationType === "standard"
                          ? "Standard (Email)"
                          : formData.verificationType === "kyc"
                            ? "KYC (ID Verification)"
                            : "Not specified"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(3)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Method</h4>
                  <p className="mt-1">
                    {formData.verificationType === "standard"
                      ? "Standard Email Verification"
                      : formData.verificationType === "kyc"
                        ? "KYC ID Verification"
                        : "Not specified"}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    {formData.verificationType === "standard"
                      ? "Voters will receive a unique link via email to access the voting session."
                      : formData.verificationType === "kyc"
                        ? "Voters will need to verify their identity using government-issued ID before voting."
                        : ""}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Visibility */}
            <AccordionItem value="visibility" className="border-b">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger
                  onClick={() => toggleSection("visibility")}
                  className="py-0 hover:no-underline flex-1"
                >
                  <div className="flex items-center text-left">
                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full mr-3">
                      {formData.visibility === "public" ? (
                        <Globe className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Visibility Settings</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.visibility === "public"
                          ? "Public"
                          : formData.visibility === "private"
                            ? "Private"
                            : "Not specified"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(4)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Access Type</h4>
                    <p className="mt-1">
                      {formData.visibility === "public"
                        ? "Public - Open to all verified users"
                        : formData.visibility === "private"
                          ? "Private - Restricted access"
                          : "Not specified"}
                    </p>
                  </div>

                  {formData.visibility === "private" && (
                    <>
                      {formData.secretPhrase && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Secret Phrase</h4>
                          <p className="mt-1 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                            {formData.secretPhrase}
                          </p>
                        </div>
                      )}

                      {formData.csvFile && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voter List</h4>
                          <p className="mt-1">CSV file uploaded: {formData.csvFile.name}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Results */}
            <AccordionItem value="results">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <AccordionTrigger onClick={() => toggleSection("results")} className="py-0 hover:no-underline flex-1">
                  <div className="flex items-center text-left">
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mr-3">
                      <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Result Visibility</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.resultVisibility === "post-completion"
                          ? "After completion"
                          : formData.resultVisibility === "real-time"
                            ? "Real-time"
                            : "Not specified"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToStep(5)
                  }}
                  className="ml-2"
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <AccordionContent className="px-6 py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Results Display</h4>
                  <p className="mt-1">
                    {formData.resultVisibility === "post-completion"
                      ? "Post Completion - Results shown after session ends"
                      : formData.resultVisibility === "real-time"
                        ? "Real-time - Live results during voting"
                        : "Not specified"}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    {formData.resultVisibility === "post-completion"
                      ? "Results will be hidden during voting and revealed to all participants once the session ends."
                      : formData.resultVisibility === "real-time"
                        ? "Results will update in real-time as votes are cast, visible to all participants."
                        : ""}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
