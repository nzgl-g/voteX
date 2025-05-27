"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { toast } from "@/lib/toast"
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
  voteType: "poll" | "election" | "tournament"
  votingMode: "single" | "multiple"
  maxSelections: number

  // Step 3
  startDate: Date
  endDate: Date
  hasNomination: boolean
  nominationStartDate: Date | null
  nominationEndDate: Date | null

  // Step 4
  verificationType: "standard" | "kyc"

  // Step 5
  visibility: "public" | "private"
  secretPhrase: string | null
  csvFile: File | null

  // Step 6
  resultVisibility: "post-completion" | "real-time"

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
  voteType: "poll",
  votingMode: "single",
  maxSelections: 3,

  // Step 3
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to a week from now
  hasNomination: false,  // Will be automatically set to true if voteType is "election"
  nominationStartDate: null,
  nominationEndDate: null,

  // Step 4
  verificationType: "standard", // Default to standard verification

  // Step 5
  visibility: "public", // Default to public
  secretPhrase: "",
  csvFile: null,

  // Step 6
  resultVisibility: "post-completion", // Default to showing results after completion

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
  const router = useRouter()

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => {
      // Check if any values are actually changing
      const hasChanges = Object.entries(data).some(([key, value]) => prev[key as keyof FormData] !== value)

      // Create updated form data
      const updatedData = hasChanges ? { ...prev, ...data } : prev;
      
      // If changing to election type, automatically set hasNomination to true
      if (data.voteType === "election") {
        updatedData.hasNomination = true;
      }

      // Only update if there are actual changes
      return hasChanges ? updatedData : prev;
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

  // Validate required fields for session creation
  const validateSessionData = () => {
    const errors = [];
    
    // Basic validation
    if (!formData.title) errors.push("Session title is required");
    if (!formData.voteType) errors.push("Vote type is required");
    if (!formData.votingMode) errors.push("Voting mode is required");
    
    // Type-specific validation
    if (formData.voteType === 'poll' && (!formData.pollOptions || formData.pollOptions.length < 2)) {
      errors.push("Poll requires at least two options");
    }
    
    if (formData.voteType === 'election') {
      // Validate nomination phase dates for elections
      if (!formData.nominationStartDate || !formData.nominationEndDate) {
        errors.push("Election requires nomination start and end dates");
      }
      
      // Ensure nomination dates are before voting dates
      if (formData.nominationStartDate && formData.nominationEndDate && formData.startDate) {
        if (formData.nominationEndDate >= formData.startDate) {
          errors.push("Nomination end date must be before voting start date");
        }
      }
    }
    
    // If we have no verification method selected
    if (!formData.verificationType) {
      errors.push("Please select a verification method");
    }
    
    // For private sessions, make sure a secret phrase is provided
    if (formData.visibility === 'private') {
      if (!formData.secretPhrase) {
        errors.push("Secret phrase is required for private sessions");
      } else if (formData.secretPhrase.length < 6) {
        errors.push("Secret phrase must be at least 6 characters");
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      const validationErrors = validateSessionData();
      if (validationErrors.length > 0) {
        toast.error(validationErrors.join("\n"));
        return;
      }
      
      setIsSubmitting(true);
      
      // Map the form data to match EXACTLY what the server expects based on Sessions.js model
      const sessionData: any = {
        name: formData.title,
        description: formData.description || "", 
        organizationName: formData.organization || "",
        banner: typeof formData.banner === 'string' ? formData.banner : null, // Use the Cloudinary URL
        
        type: formData.voteType,
        subtype: formData.votingMode,
        
        // Ensure visibility is properly set to match backend expectations
        visibility: formData.visibility.toLowerCase(),
        resultVisibility: formData.resultVisibility,
        
        subscription: {
          name: subscription,
          price: subscription === 'free' ? 0 : 49.99,
          voterLimit: subscription === 'free' ? 100 : 5000,
          features: [],
          isRecommended: false
        },
        
        sessionLifecycle: {
          // Backend sets createdAt automatically
          scheduledAt: formData.voteType === 'election' && formData.hasNomination ? {
            // For elections with nomination, scheduledAt holds nomination dates
            start: formData.nominationStartDate ? formData.nominationStartDate.toISOString() : null,
            end: formData.nominationEndDate ? formData.nominationEndDate.toISOString() : null
          } : {
            // For polls or elections without nomination, scheduledAt matches voting dates
            start: formData.startDate.toISOString(),
            end: formData.endDate.toISOString()
          },
          // startedAt and endedAt always represent the voting period
          startedAt: formData.startDate.toISOString(),
          endedAt: formData.endDate.toISOString()
        },
        
        contractAddress: null,
        
        // Security settings - use exact enum values from Sessions.js
        securityMethod: formData.visibility === 'private' ? 'Secret Phrase' : null,
        secretPhrase: formData.visibility === 'private' ? formData.secretPhrase : null,
        verificationMethod: formData.verificationType,
        
        // Required empty arrays/defaults
        candidateRequests: [],
        participants: [],
        allowDirectEdit: false,
        allowsOfficialPapers: false,
        team: null // Server will set this
      };
      
      // Add type-specific data
      if (formData.voteType === 'poll') {
        // Match the optionSchema structure exactly
        sessionData.options = formData.pollOptions.map(option => ({
          name: option.title,
          description: option.description || null,
          totalVotes: 0 // Default as per schema
        }));
        
        sessionData.maxChoices = formData.votingMode === 'multiple' ? formData.maxSelections : 1;
      } else if (formData.voteType === 'election') {
        // Initialize candidates array to match candidateSchema
        sessionData.candidates = [];
        
        if (!formData.hasNomination && formData.candidates.length > 0) {
          sessionData.candidates = formData.candidates.map(candidate => ({
            user: candidate.id && /^[0-9a-fA-F]{24}$/.test(candidate.id) 
              ? candidate.id 
              : "000000000000000000000000", // Default ObjectId
            assignedReviewer: null,
            partyName: 'Independent',
            totalVotes: 0,
            requiresReview: false,
            paper: null,
            fullName: candidate.name,
            biography: candidate.biography || "",
            experience: "",
            nationalities: [],
            dobPob: {
              dateOfBirth: null,
              placeOfBirth: ""
            },
            promises: []
          }));
        }
        
        sessionData.maxChoices = formData.votingMode === 'multiple' ? formData.maxSelections : 1;
      }
      
      console.log('Creating session with data:', JSON.stringify(sessionData, null, 2));
      
      // Call the session service to create the session
      const response = await sessionService.createSession(sessionData);
      
      toast.success("Your voting session has been created successfully.");

      // If onSuccess was provided, call it with the new session ID
      if (onSuccess && response._id) {
        onSuccess(response._id);
      } else if (response._id) {
        // Redirect to the session details page
        router.push(`/team-leader/session/${response._id}`);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error(`Failed to create the session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          // For elections, always require nomination dates and voting dates
          const hasValidNominationDates = !!formData.nominationStartDate && 
                                          !!formData.nominationEndDate && 
                                          formData.nominationStartDate < formData.nominationEndDate;
                                          
          const hasValidVotingDates = !!formData.startDate && 
                                      !!formData.endDate && 
                                      formData.startDate < formData.endDate;
                                      
          const isNominationBeforeVoting = !!formData.nominationEndDate && 
                                           !!formData.startDate && 
                                           formData.nominationEndDate < formData.startDate;
                                           
          return hasValidNominationDates && hasValidVotingDates && isNominationBeforeVoting;
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
        } else if (formData.voteType === "election") {
          // For elections with nomination phase, no need for initial candidates
          return true
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
                      className={`relative z-10 size-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < currentStep 
                          ? "bg-primary text-primary-foreground" 
                          : index === currentStep 
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span 
                      className={`mt-2 text-xs font-medium max-w-[80px] text-center transition-colors hidden sm:block ${
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
      </div>
  )
}