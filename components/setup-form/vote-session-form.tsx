"use client"

import { useState } from "react"
import { Progress } from "@/components/shadcn-ui/progress"
import { Button } from "@/components/shadcn-ui/button"
import { BasicInformationStep } from "@/components/setup-form/steps/basic-information-step"
import { VoteTypeStep } from "@/components/setup-form/steps/vote-type-step"
import { LifecycleStep } from "@/components/setup-form/steps/lifecycle-step"
import { AccessControlStep } from "@/components/setup-form/steps/access-control-step"
import { VerificationStep } from "@/components/setup-form/steps/verification-step"
import { ResultsDisplayStep } from "@/components/setup-form/steps/results-display-step"
import { SetupConfigurationStep } from "@/components/setup-form/steps/setup-configuration-step"
import { SummaryStep } from "@/components/setup-form/steps/summary-step"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/shadcn-ui/toaster"
import apiClient, { authApi } from "@/lib/api"

// Define the session state interface based on the provided types
export interface SessionFormState {
  id?: string
  name: string
  description: string | null
  organizationName: string | null
  banner: string | null
  sessionLifecycle: {
    createdAt: string
    scheduledAt: {
      start: string | null
      end: string | null
    }
    startedAt: string | null
    endedAt: string | null
  }
  type: "poll" | "election" | "tournament"
  subtype: "ranked" | "multiple" | "Single" | "double elimination" | "single elimination"
  tournamentType: "round Robin" | "knockout" | "swiss" | null
  accessLevel: "public" | "private"
  securityMethod: "secret phrase" | "csv" | null
  verificationMethod: "standard" | "kyc" | null
  candidateStep: "nomination" | "manual"
  candidates: Candidate[] | null
  options: Option[] | null
  secretPhrase: string | null
  subscription: {
    name: "free" | "pro" | "enterprise" | undefined
    price?: number
  }
  resultsDisplay: "real-time" | "post-completion"
}

export interface Candidate {
  id?: string
  fullName: string
  status?: "verified" | "pending" | "refused"
  assignedReviewer?: any | null
  partyName: string
  totalVotes?: number
  requiresReview?: boolean
  sessionId?: string
}

export interface Option {
  id?: string
  name: string
  description: string | null
  totalVotes?: number
  sessionId?: string
}

// Update the VoteSessionForm component to accept a plan prop
export interface VoteSessionFormProps {
  plan?: "free" | "pro" | "enterprise"
}

export function VoteSessionForm({ plan }: VoteSessionFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState<SessionFormState>({
    name: "",
    description: null,
    organizationName: null,
    banner: null,
    sessionLifecycle: {
      createdAt: new Date().toISOString(),
      scheduledAt: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      startedAt: new Date().toISOString(),
      endedAt: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    },
    type: "poll",
    subtype: "Single",
    tournamentType: "swiss",
    accessLevel: "public",
    securityMethod: "secret phrase",
    verificationMethod: "standard",
    candidateStep: "manual",
    candidates: null,
    options: [],
    secretPhrase: null,
    subscription: {
      name: plan,
    },
    resultsDisplay: "real-time",
  })

  // Add validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Add validation function
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate based on current step
    switch (step) {
      case 0: // Basic Information
        if (!formState.name || formState.name.trim() === "") {
          newErrors.name = "Title is required"
        }
        if (!formState.description || formState.description.trim() === "") {
          newErrors.description = "Description is required"
        }
        break
      case 6: // Setup Configuration
        if (formState.type === "poll" && (!formState.options || formState.options.length === 0)) {
          newErrors.options = "At least one option is required"
        } else if (
          (formState.type === "election" || formState.type === "tournament") &&
          (!formState.candidates || formState.candidates.length === 0)
        ) {
          newErrors.candidates = "At least one candidate is required"
        }
        break
      // Add validation for other steps as needed
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const steps = [
    { name: "Basic Information", component: BasicInformationStep },
    { name: "Vote Type", component: VoteTypeStep },
    { name: "Lifecycle", component: LifecycleStep },
    { name: "Access Control", component: AccessControlStep },
    { name: "Verification", component: VerificationStep },
    { name: "Results Display", component: ResultsDisplayStep },
    { name: "Setup Configuration", component: SetupConfigurationStep },
    { name: "Summary", component: SummaryStep },
  ]

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  // Add function to jump to a specific step (for edit buttons)
  const jumpToStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo(0, 0)
  }

  // Pass the errors and jumpToStep function to the step components
  const CurrentStepComponent = steps[currentStep].component

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)






  const updateFormState = (newState: Partial<SessionFormState>) => {
    setFormState({ ...formState, ...newState })
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      // Convert form state values to match the backend's expected structure
      // The backend expects subtype as 'subtype' field
      const prepareSubtype = (subtype: string) => {
        const subtypeLower = subtype.toLowerCase();
        if (subtypeLower === 'single') return 'single';
        if (subtypeLower === 'multiple') return 'multiple';
        if (subtypeLower === 'ranked') return 'ranked';
        if (subtypeLower === 'single elimination') return 'single elimination';
        if (subtypeLower === 'double elimination') return 'double elimination';
        return 'single'; // Default
      };

      const prepareTournamentType = (type: string | null) => {
        if (!type) return null;
        const typeLower = type.toLowerCase();
        if (typeLower === 'round robin') return 'Round Robin';
        if (typeLower === 'knockout') return 'Knockout';
        if (typeLower === 'swiss') return 'Swiss';
        return null;
      };

      // Convert accessLevel to match the backend's 'accessLevel' field
      const prepareAccessLevel = (accessLevel: string) => {
        return accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1).toLowerCase(); // 'public' -> 'Public'
      };

      // Convert securityMethod to match the backend's enum
      const prepareSecurityMethod = (method: string | null) => {
        if (!method) return null;
        if (method.toLowerCase() === 'secret phrase') return 'Secret Phrase';
        if (method.toLowerCase() === 'area restriction') return 'Area Restriction';
        return null;
      };

      // Convert verificationMethod to match the backend's enum
      const prepareVerificationMethod = (method: string | null) => {
        if (!method) return null;
        if (method.toLowerCase() === 'standard') return null; // Standard is not in the backend enum
        if (method.toLowerCase() === 'kyc') return 'KYC';
        if (method.toLowerCase() === 'cvc') return 'CVC';
        return null;
      };

      // Prepare candidates data if present
      const prepareCandidates = () => {
        if (!formState.candidates || formState.candidates.length === 0) return [];
        
        return formState.candidates.map(candidate => ({
          user: candidate.id, // Assuming id is the user ID
          partyName: candidate.partyName,
          status: "Pending", // Default status
          requiresReview: false
        }));
      };

      // Prepare options data if present
      const prepareOptions = () => {
        if (!formState.options || formState.options.length === 0) return [];
        
        return formState.options.map(option => ({
          name: option.name,
          description: option.description
        }));
      };

      // Prepare subscription data
      const prepareSubscription = () => {
        const subscriptionName = formState.subscription?.name || 'free';
        const subscriptionPrice = formState.subscription?.price || 0;
        
        return {
          name: subscriptionName,
          price: subscriptionPrice,
          voterLimit: subscriptionName === 'free' ? 100 : (subscriptionName === 'pro' ? 500 : null),
          features: [],
          isRecommended: subscriptionName === 'pro'
        };
      };

      // Map the form state to match the server's expected structure
      const sessionData = {
        name: formState.name,
        description: formState.description,
        organizationName: formState.organizationName,
        banner: formState.banner,
        type: formState.type,
        subtype: prepareSubtype(formState.subtype),
        accessLevel: prepareAccessLevel(formState.accessLevel),
        securityMethod: prepareSecurityMethod(formState.securityMethod),
        verificationMethod: prepareVerificationMethod(formState.verificationMethod),
        sessionLifecycle: formState.sessionLifecycle,
        subscription: prepareSubscription(),
        // Add type-specific fields
        ...(formState.type === 'election' && { candidates: prepareCandidates() }),
        ...(formState.type === 'poll' && { options: prepareOptions() }),
        ...(formState.type === 'tournament' && { 
          tournamentType: prepareTournamentType(formState.tournamentType),
          bracket: {},
          maxRounds: 1
        })
      };

      // Send the data to the server using authenticated API
      // Use the correct endpoint from the backend (/sessions)
      const response = await apiClient.post('/sessions', sessionData);
      
      // Handle successful submission
      toast({
        title: "Success!",
        description: "Your session has been created successfully.",
        variant: "default",
      });
      
      // Redirect or perform other actions based on the response
      console.log('Session created:', response.data);
      
      // If subscription is not free, redirect to payment
      if (formState.subscription.name !== "free") {
        // Redirect to payment page
        window.location.href = `/payment?sessionId=${response.data._id}`;
      } else {
        // Redirect to dashboard or sessions page
        window.location.href = "/team-leader/real-time-analytics";
      }
    } catch (error: any) {
      console.error('Error creating session:', error);
      
      // Handle submission error
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update the render function to pass the necessary props to step components
  return (
    <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden">
      <Toaster />
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">
            Step {currentStep + 1}: {steps[currentStep].name}
          </h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="p-6">
        <CurrentStepComponent
          formState={formState}
          updateFormState={updateFormState}
          errors={errors}
          jumpToStep={jumpToStep}
        />
      </div>

      <div className="p-6 border-t bg-muted/20 flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              formState.subscription.name === "free" ? "Publish Session" : "Proceed to Payment"
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
