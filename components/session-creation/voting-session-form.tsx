"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { sessionService, Session } from "@/services/session-service"

import Step1BasicInfo from "./steps/step-1-basic-info"
import Step2VotingType from "./steps/step-2-voting-type"
import Step3Lifecycle from "./steps/step-3-lifecycle"
import Step4Verification from "./steps/step-4-verification"
import Step5Visibility from "./steps/step-5-visibility"
import Step6Results from "./steps/step-6-results"
import Step7SessionData from "./steps/step-7-session-data"
import Step8Summary from "./steps/step-8-summary"

export type PollOption = {
  id: string
  title: string
  description: string
}

export type Candidate = {
  id: string
  name: string
  biography: string
}

export type FormData = {
  // Step 1
  title: string
  description: string
  organization: string
  banner: string | File | null

  // Step 2
  voteType: "poll" | "election" | "tournament" | null
  votingMode: "single" | "multiple" | "ranked" | null
  maxSelections: number
  maxRanks: number

  // Step 3
  startDate: Date | null
  endDate: Date | null
  hasNomination: boolean
  nominationStartDate: Date | null
  nominationEndDate: Date | null

  // Step 4
  verificationType: "standard" | "kyc" | null

  // Step 5
  visibility: "public" | "private" | null
  secretPhrase: string
  csvFile: File | null

  // Step 6
  resultVisibility: "post-completion" | "real-time" | null

  // Step 7
  pollOptions: PollOption[]
  candidates: Candidate[]
}

const initialFormData: FormData = {
  // Step 1
  title: "",
  description: "",
  organization: "",
  banner: null,

  // Step 2
  voteType: null,
  votingMode: null,
  maxSelections: 3,
  maxRanks: 3,

  // Step 3
  startDate: null,
  endDate: null,
  hasNomination: false,
  nominationStartDate: null,
  nominationEndDate: null,

  // Step 4
  verificationType: null,

  // Step 5
  visibility: null,
  secretPhrase: "",
  csvFile: null,

  // Step 6
  resultVisibility: null,

  // Step 7
  pollOptions: [],
  candidates: [],
}

const steps = [
  "Basic Info",
  "Voting Type",
  "Lifecycle",
  "Verification",
  "Visibility",
  "Results",
  "Session Data",
  "Summary",
]

interface VotingSessionFormProps {
  subscription: "free" | "pro"
  onSuccess?: (sessionId: string) => void
}

export default function VotingSessionForm({ subscription, onSuccess }: VotingSessionFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => {
      // Check if any values are actually changing
      const hasChanges = Object.entries(data).some(([key, value]) => prev[key as keyof FormData] !== value)

      // Only update if there are actual changes
      return hasChanges ? { ...prev, ...data } : prev
    })
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Map the form data to the Session interface format
      const sessionData: any = {
        name: formData.title,
        description: formData.description,
        organizationName: formData.organization,
        // For banner, you would need to upload it separately and get a URL
        // banner: formData.banner ? URL of uploaded banner : undefined,
        
        type: formData.voteType as 'election' | 'poll' | 'tournament',
        subtype: formData.votingMode as 'single' | 'multiple' | 'ranked',
        
        accessLevel: formData.visibility === 'private' ? 'Private' : 'Public',
        
        subscription: {
          name: subscription,
          price: subscription === 'free' ? 0 : 49.99,
          voterLimit: subscription === 'free' ? 100 : 5000,
        },
        
        sessionLifecycle: {
          // Add created date
          createdAt: new Date().toISOString(),
          // Add scheduled dates if nomination is enabled
          scheduledAt: formData.hasNomination && formData.nominationStartDate && formData.nominationEndDate ? {
            start: formData.nominationStartDate.toISOString(),
            end: formData.nominationEndDate.toISOString()
          } : undefined,
          // Voting period
          // These are added later when the session is started
          // startedAt: formData.startDate?.toISOString(),
          // endedAt: formData.endDate?.toISOString(),
        },
        
        // Security settings
        securityMethod: formData.visibility === 'private' ? 'Secret Phrase' : null,
        secretPhrase: formData.visibility === 'private' ? formData.secretPhrase : undefined,
        verificationMethod: formData.verificationType === 'kyc' ? 'KYC' : null,
      };
      
      // Add type-specific data
      if (formData.voteType === 'poll') {
        sessionData.options = formData.pollOptions.map(option => ({
          name: option.title,
          description: option.description,
          totalVotes: 0
        }));
        sessionData.maxChoices = formData.votingMode === 'multiple' ? formData.maxSelections : 1;
      } else if (formData.voteType === 'election') {
        // If not in nomination phase, add candidates
        if (!formData.hasNomination) {
          sessionData.candidates = formData.candidates.map(candidate => ({
            user: candidate.id, // This would normally be a user ID
            fullName: candidate.name,
            biography: candidate.biography,
            partyName: '',
            totalVotes: 0
          }));
        }
        sessionData.maxChoices = formData.votingMode === 'multiple' ? formData.maxSelections : 1;
      }
      
      // Call the session service to create the session
      const response = await sessionService.createSession(sessionData);
      
      toast({
        title: "Success!",
        description: "Your voting session has been created successfully.",
        variant: "default",
      });

      // If onSuccess was provided, call it with the new session ID
      if (onSuccess && response._id) {
        onSuccess(response._id);
      } else if (response._id) {
        // Redirect to the session details page
        router.push(`/team-leader/session/${response._id}`);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return !!formData.title && !!formData.description && formData.description.length <= 200
      case 1: // Voting Type
        return !!formData.voteType && !!formData.votingMode
      case 2: // Lifecycle
        if (formData.voteType === "poll") {
          return !!formData.startDate && !!formData.endDate
        } else if (formData.voteType === "election") {
          if (formData.hasNomination) {
            return (
                !!formData.startDate &&
                !!formData.endDate &&
                !!formData.nominationStartDate &&
                !!formData.nominationEndDate
            )
          }
          return !!formData.startDate && !!formData.endDate
        }
        return false
      case 3: // Verification
        return !!formData.verificationType
      case 4: // Visibility
        if (formData.visibility === "private") {
          return !!formData.secretPhrase || !!formData.csvFile
        }
        return !!formData.visibility
      case 5: // Results
        return !!formData.resultVisibility
      case 6: // Session Data
        if (formData.voteType === "poll") {
          return formData.pollOptions.length > 0
        } else if (formData.voteType === "election" && !formData.hasNomination) {
          return formData.candidates.length > 0
        }
        return true
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1BasicInfo formData={formData} updateFormData={updateFormData} />
      case 1:
        return <Step2VotingType formData={formData} updateFormData={updateFormData} subscription={subscription} />
      case 2:
        return <Step3Lifecycle formData={formData} updateFormData={updateFormData} />
      case 3:
        return <Step4Verification formData={formData} updateFormData={updateFormData} subscription={subscription} />
      case 4:
        return <Step5Visibility formData={formData} updateFormData={updateFormData} />
      case 5:
        return <Step6Results formData={formData} updateFormData={updateFormData} />
      case 6:
        return <Step7SessionData formData={formData} updateFormData={updateFormData} />
      case 7:
        return <Step8Summary formData={formData} goToStep={goToStep} />
      default:
        return null
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto bg-card rounded-xl shadow-xl overflow-hidden border border-border/30">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-background/10 via-transparent to-transparent opacity-30"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold">Create Voting Session</h1>
            <p className="opacity-90 sm:text-base max-w-xl">Set up your perfect voting experience in a few simple steps</p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="mb-10">
            <div className="relative">
              <div className="absolute h-0.5 top-5 left-0 w-full bg-muted">
                <div 
                  className="h-0.5 bg-primary transition-all duration-300 ease-in-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between relative">
                {steps.map((step, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col items-center cursor-pointer ${
                      index !== currentStep && index !== currentStep - 1 && index !== currentStep + 1 
                        ? "hidden sm:flex" 
                        : ""
                    }`}
                    onClick={() => index < currentStep && goToStep(index)}
                  >
                    <div 
                      className={`relative z-10 size-8 sm:size-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < currentStep 
                          ? "bg-primary text-primary-foreground" 
                          : index === currentStep 
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span 
                      className={`mt-2 text-xs font-medium max-w-[60px] sm:max-w-[80px] text-center transition-colors hidden sm:block ${
                        index <= currentStep ? "text-primary" : "text-muted-foreground/60"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Mobile step indicator */}
              <div className="sm:hidden flex justify-center mt-8 text-sm">
                <span className="font-medium">Step {currentStep + 1}:</span>
                <span className="ml-2 text-primary">{steps[currentStep]}</span>
                <span className="mx-2 text-muted-foreground/60">•</span>
                <span className="text-muted-foreground/60">{currentStep + 1} of {steps.length}</span>
              </div>
            </div>
          </div>

          <div className="min-h-[420px] rounded-xl border border-border/50 bg-card/50 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{steps[currentStep]}</h2>
              <div className="h-1 w-20 bg-primary/60 rounded-full mt-2"></div>
            </div>
            <div className="pt-4 w-full overflow-x-hidden">{renderStep()}</div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0} 
              className="flex items-center gap-2 px-4 sm:px-5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Previous</span>
            </Button>

            {currentStep < steps.length - 1 ? (
                <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    variant="default"
                    className="flex items-center gap-2 px-4 sm:px-5 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <span className="hidden sm:inline">Next</span> <ArrowRight size={16} />
                </Button>
            ) : (
                <Button
                    onClick={handleSubmit}
                    variant="default"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white flex items-center gap-2 px-4 sm:px-5 rounded-lg shadow-md hover:shadow-lg transition-all"
                    disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : <span>Create Session</span>} <Check size={16} />
                </Button>
            )}
          </div>
        </div>
        <Toaster />
      </div>
  )
}
