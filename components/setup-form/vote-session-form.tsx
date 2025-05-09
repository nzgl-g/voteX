"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BasicInformationStep } from "@/components/setup-form/steps/basic-information-step"
import { VoteTypeStep } from "@/components/setup-form/steps/vote-type-step"
import LifecycleStep from "@/components/setup-form/steps/lifecycle-step"
import { AccessControlStep } from "@/components/setup-form/steps/access-control-step"
import { VerificationStep } from "@/components/setup-form/steps/verification-step"
import { ResultsDisplayStep } from "@/components/setup-form/steps/results-display-step"
import { SetupConfigurationStep } from "@/components/setup-form/steps/setup-configuration-step"
import SummaryStep from "@/components/setup-form/steps/summary-step"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
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
  requirePapers: boolean
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
  onComplete?: () => void
}

export function VoteSessionForm({ plan, onComplete }: VoteSessionFormProps) {
  const router = useRouter()
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
    requirePapers: false,
    candidates: null,
    options: [],
    secretPhrase: "",
    subscription: {
      name: plan || "free",
    },
    resultsDisplay: "real-time",
  })

  // Ensure formState.subscription.name is updated when plan prop changes
  useEffect(() => {
    if (plan && plan !== formState.subscription.name) {
      setFormState(prevState => ({
        ...prevState,
        subscription: {
          ...prevState.subscription,
          name: plan
        }
      }));
    }
  }, [plan, formState.subscription.name]);

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
      case 1: // Vote Type
        if (formState.type === "tournament") {
          newErrors.type = "Tournament type is coming soon and not available for selection yet"
        }
        break
      case 2: // Lifecycle
        // Validate basic date ranges
        if (!formState.sessionLifecycle.startedAt) {
          newErrors.startDate = "Start date is required"
        }
        if (!formState.sessionLifecycle.endedAt) {
          newErrors.endDate = "End date is required"
        }
        
        // If using nomination, validate nomination dates
        if (formState.candidateStep === "nomination") {
          const start = formState.sessionLifecycle.scheduledAt.start ? new Date(formState.sessionLifecycle.scheduledAt.start) : null
          const end = formState.sessionLifecycle.scheduledAt.end ? new Date(formState.sessionLifecycle.scheduledAt.end) : null
          const votingStart = formState.sessionLifecycle.startedAt ? new Date(formState.sessionLifecycle.startedAt) : null
          
          if (!start) {
            newErrors.nominationStart = "Nomination start date is required"
          }
          if (!end) {
            newErrors.nominationEnd = "Nomination end date is required"
          }
          
          if (start && end && start > end) {
            newErrors.nominationDates = "Nomination end date must be after start date"
          }
          
          if (end && votingStart && end > votingStart) {
            newErrors.nominationDates = "Nomination period must end before voting starts"
          }
        }
        break
      case 3: // Access Control
        if (formState.accessLevel === "private" && formState.securityMethod === "secret phrase" && 
            (!formState.secretPhrase || formState.secretPhrase.trim() === "")) {
          newErrors.secretPhrase = "Secret phrase is required for private sessions"
        }
        break
      case 6: // Setup Configuration
        if (formState.type === "poll" && (!formState.options || formState.options.length === 0)) {
          newErrors.options = "At least one option is required"
        } else if (
          (formState.type === "election" || formState.type === "tournament") &&
          formState.candidateStep === "manual" && // Only require candidates if using manual mode
          (!formState.candidates || formState.candidates.length === 0)
        ) {
          newErrors.candidates = "At least one candidate is required"
        } else if (
          (formState.type === "election" || formState.type === "tournament") &&
          formState.candidateStep === "nomination"
        ) {
          // For nomination mode, we don't need candidates but we need valid nomination dates
          const hasScheduledDates = formState.sessionLifecycle.scheduledAt &&
                                   formState.sessionLifecycle.scheduledAt.start &&
                                   formState.sessionLifecycle.scheduledAt.end;
                                   
          if (!hasScheduledDates) {
            // This should not happen since we validated it in step 2
            // But we add a check for completeness
            console.log("Warning: Nomination mode selected but nomination dates not configured");
          }
          
          // No validation error for this case - nomination mode is valid without candidates
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
    // Ensure type consistency by creating a new state object
    const typedNewState = { ...newState };
    
    // Perform the update with proper type handling
    setFormState(prevState => ({ ...prevState, ...typedNewState }));
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      // Log current subscription plan
      console.log('Creating session with plan:', plan || formState.subscription.name || 'free');
      
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
        // Always use the original plan value passed to the component if available
        const subscriptionName = plan || formState.subscription?.name || 'free';
        const subscriptionPrice = formState.subscription?.price || 0;
        
        // Define features based on subscription plan
        let features: string[] = [];
        
        if (subscriptionName === 'free') {
          features = ['Poll voting only', 'Standard verification', 'Up to 100 voters'];
        } else if (subscriptionName === 'pro') {
          features = [
            'All voting types (polls, elections, tournament)',
            'KYC verification',
            'Full-time priority support',
            'Up to 10,000 voters',
            'Private access'
          ];
        } else if (subscriptionName === 'enterprise') {
          features = [
            'Private blockchain deployment',
            'Unlimited voters and votes',
            'Full-time priority support',
            'All pro features included'
          ];
        }
        
        return {
          name: subscriptionName,
          price: subscriptionPrice,
          voterLimit: subscriptionName === 'free' ? 100 : (subscriptionName === 'pro' ? 10000 : null),
          features: features,
          isRecommended: subscriptionName === 'pro'
        };
      };

      // Make sure scheduledAt is properly formatted for nomination period
      const prepareSessionLifecycle = () => {
        const lifecycle = {
          ...formState.sessionLifecycle
        };
        
        // If candidateStep is set to manual, ensure scheduledAt values are null 
        // (to prevent default ISO strings being sent)
        if (formState.candidateStep === "manual") {
          lifecycle.scheduledAt = {
            start: null,
            end: null
          };
        } else if (formState.candidateStep === "nomination") {
          // Make sure we have actual dates for nomination period
          if (!lifecycle.scheduledAt.start || !lifecycle.scheduledAt.end) {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            lifecycle.scheduledAt = {
              start: lifecycle.scheduledAt.start || now.toISOString(),
              end: lifecycle.scheduledAt.end || tomorrow.toISOString()
            };
          }
        }
        
        return lifecycle;
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
        sessionLifecycle: prepareSessionLifecycle(),
        candidateStep: formState.candidateStep,
        requirePapers: formState.requirePapers,
        subscription: prepareSubscription(),
        // Only include secretPhrase when security method is "secret phrase" AND it has a non-null value
        ...(formState.securityMethod === "secret phrase" && formState.secretPhrase ? { secretPhrase: formState.secretPhrase } : {}),
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
      
      console.log('Session created:', response.data);
      
      // Get the active subscription plan from our form data
      const activePlan = sessionData.subscription.name;
      
      // If subscription is not free, redirect to payment page
      if (activePlan !== "free") {
        // Redirect to payment page with session ID and plan
        router.push(`/payment?sessionId=${response.data._id}&plan=${activePlan}`);
      } else {
        // Free plan - redirect directly to monitoring dashboard
        toast({
          title: "Session Published!",
          description: "Your free session has been published successfully.",
          variant: "default",
        });
        router.push(`/team-leader/monitoring/${response.data._id}`);
      }

      // After successful submission
      toast({
        title: "Success!",
        description: "Your vote session has been created.",
      })
      
      // If in dialog and onComplete provided, call it
      if (onComplete) {
        onComplete();
      } else {
        // Otherwise redirect to the dashboard or appropriate page
        router.push("/voter");
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

  // Update the render function to be more responsive
  return (
    <div className="w-full space-y-4 sm:space-y-6 min-h-0">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">{steps[currentStep].name}</h2>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-muted-foreground">{steps[currentStep].name}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="bg-card p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-sm overflow-y-auto border border-border/40">
        <div className="max-w-full mx-auto">
          <CurrentStepComponent
            formState={formState}
            updateFormState={updateFormState}
            errors={errors}
            jumpToStep={jumpToStep}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-1 w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="gap-1 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>Create Vote Session</>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-1 w-full sm:w-auto">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Toaster />
    </div>
  )
}
