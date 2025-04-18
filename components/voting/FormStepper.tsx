import { cn } from "@/lib/utils";
import { FormStep } from "@/lib/voting";
import { CheckIcon } from "lucide-react";
import { Progress } from "@/components/shadcn-ui/progress";
import { Badge } from "@/components/shadcn-ui/badge";
import { useState, useEffect } from "react";

interface FormStepperProps {
    steps: FormStep[];
    currentStep: number;
    onStepClick: (step: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
    const [progressValue, setProgressValue] = useState(0);

    // Animate progress bar when step changes
    useEffect(() => {
        // Start with 0 and animate to the actual value
        setProgressValue(0);

        // Use timeout to create animation effect
        const timer = setTimeout(() => {
            setProgressValue(((currentStep + 1) / steps.length) * 100);
        }, 100);

        return () => clearTimeout(timer);
    }, [currentStep, steps.length]);

    return (
        <div className="w-full mb-8">
            {/* Desktop version */}
            <div className="hidden sm:block">
                {/* Progress bar */}
                <div className="mb-6">
                    <Progress
                        value={progressValue}
                        className="h-3"
                    />
                </div>

                {/* Step indicators */}
                <div className="flex justify-between px-2">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={cn(
                                "flex flex-col items-center relative",
                                index === 0 ? "ml-0" : "",
                                index === steps.length - 1 ? "mr-0" : ""
                            )}
                            style={{
                                flex: "1",
                                maxWidth: `${100 / steps.length}%`
                            }}
                        >
                            {/* Circle markers (absolute positioned over progress bar) */}
                            <div className="absolute -top-11">
                                <button
                                    type="button"
                                    onClick={() => onStepClick(index)}
                                    className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-full transition-all",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                                        index <= currentStep
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted border border-muted-foreground/30",
                                    )}
                                    aria-current={currentStep === index ? "step" : undefined}
                                >
                                    {index < currentStep ? (
                                        <CheckIcon className="w-3 h-3" />
                                    ) : (
                                        <span className="text-xs">{index + 1}</span>
                                    )}
                                </button>
                            </div>

                            {/* Step label badges */}
                            <Badge
                                variant={index <= currentStep ? "default" : "outline"}
                                className={cn(
                                    "mt-2 text-xs cursor-pointer truncate px-3 py-1 font-normal text-center",
                                    index === currentStep ? "bg-primary" :
                                        index < currentStep ? "bg-primary/80" : "",
                                    index === currentStep ? "shadow-sm" : "",
                                )}
                                onClick={() => onStepClick(index)}
                            >
                                {step.label}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Version */}
            <div className="sm:hidden">
                <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
                    <span className="text-sm font-medium">
            {steps[currentStep].label}
          </span>
                </div>
                <Progress value={progressValue} className="h-2" />

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {steps.map((step, index) => (
                        <Badge
                            key={step.id}
                            variant={index <= currentStep ? "default" : "outline"}
                            className={cn(
                                "text-xs cursor-pointer",
                                index === currentStep ? "bg-primary" :
                                    index < currentStep ? "bg-primary/80" : "",
                            )}
                            onClick={() => onStepClick(index)}
                        >
                            {index + 1}. {step.label}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}