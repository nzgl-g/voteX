import { useState } from "react";
import { FormStepper } from "@/components/voting/FormStepper";
import { FormStep, PlanType, VotingSessionType, VotingMode, AccessControlType, CandidateEntryType } from "@/lib/voting";
import { Button } from "@/components/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn-ui/card";
import { CoreDetailsStep } from "@/components/voting/steps/CoreDetailsStep";
import { SessionTypeStep } from "@/components/voting/steps/SessionTypeStep";
import { LifecycleStep } from "@/components/voting/steps/LifecycleStep";
import { AccessControlStep } from "@/components/voting/steps/AccessControlStep";
import { RealTimeResultsStep } from "@/components/voting/steps/RealTimeResultsStep";
import { VoterVerificationStep } from "@/components/voting/steps/VoterVerificationStep";
import { VotingOptionsStep } from "@/components/voting/steps/VotingOptionsStep";
import { SummaryStep } from "@/components/voting/steps/SummaryStep";
import { ArrowLeft, ArrowRight, CheckIcon, CreditCard } from "lucide-react";

interface VotingSessionFormProps {
    plan: PlanType;
}

const FORM_STEPS: FormStep[] = [
    { id: "core-details", label: "Details", description: "Basic information" },
    { id: "session-type", label: "Type", description: "Voting mechanism" },
    { id: "lifecycle", label: "Schedule", description: "Timing settings" },
    { id: "access-control", label: "Access", description: "Who can vote" },
    { id: "real-time-results", label: "Results", description: "Display options" },
    { id: "voter-verification", label: "Verification", description: "Identity checks" },
    { id: "voting-options", label: "Options", description: "What to vote on" },
    { id: "summary", label: "Summary", description: "Review & confirm" },
];

export default function VotingSessionForm({ plan }: VotingSessionFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        organization: "",
        banner: { id: "", url: "" },
        sessionType: "" as VotingSessionType,
        votingMode: "" as VotingMode,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week later
        preparationSchedule: null as Date | null,
        accessControl: "public" as AccessControlType,
        secretPhrase: "",
        csvInviteFile: null as File | null,
        displayLiveResults: true,
        verificationMethod: "standard",
        options: [] as { title: string; description: string }[],
        candidateEntryMethod: "manual" as CandidateEntryType,
        candidates: [] as { name: string; email: string }[],
    });

    const handleStepClick = (index: number) => {
        if (index <= currentStep) {
            setCurrentStep(index);
        }
    };

    const handleNext = () => {
        if (currentStep < FORM_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = () => {
        // Here you would typically send the form data to your backend
        console.log("Form submitted:", formData);
        // Show success message or redirect
    };

    const updateFormData = (newData: Partial<typeof formData>) => {
        setFormData(prevData => ({ ...prevData, ...newData }));
    };

    const handleEditStep = (stepIndex: number) => {
        setCurrentStep(stepIndex);
        window.scrollTo(0, 0);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="w-full max-w-5xl mx-auto">
                <CardHeader className="text-center border-b pb-6">
                    <CardTitle className="text-2xl font-bold">Create Voting Session</CardTitle>
                    <CardDescription>
                        Set up a new voting session for your organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <FormStepper
                        steps={FORM_STEPS}
                        currentStep={currentStep}
                        onStepClick={handleStepClick}
                    />

                    <div className="py-6">
                        {currentStep === 0 && (
                            <CoreDetailsStep
                                formData={formData}
                                updateFormData={updateFormData}
                            />
                        )}

                        {currentStep === 1 && (
                            <SessionTypeStep
                                formData={formData}
                                updateFormData={updateFormData}
                                plan={plan}
                            />
                        )}

                        {currentStep === 2 && (
                            <LifecycleStep
                                formData={formData}
                                updateFormData={updateFormData}
                            />
                        )}

                        {currentStep === 3 && (
                            <AccessControlStep
                                formData={formData}
                                updateFormData={updateFormData}
                            />
                        )}

                        {currentStep === 4 && (
                            <RealTimeResultsStep
                                formData={formData}
                                updateFormData={updateFormData}
                            />
                        )}

                        {currentStep === 5 && (
                            <VoterVerificationStep
                                formData={formData}
                                updateFormData={updateFormData}
                                plan={plan}
                            />
                        )}

                        {currentStep === 6 && (
                            <VotingOptionsStep
                                formData={formData}
                                updateFormData={updateFormData}
                                plan={plan}
                                sessionType={formData.sessionType}
                            />
                        )}

                        {currentStep === 7 && (
                            <SummaryStep
                                formData={formData}
                                plan={plan}
                                onEditStep={handleEditStep}
                            />
                        )}
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        {currentStep === FORM_STEPS.length - 1 ? (
                            plan === "free" ? (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="gap-2"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                    Publish
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="gap-2"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Payment
                                </Button>
                            )
                        ) : (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
