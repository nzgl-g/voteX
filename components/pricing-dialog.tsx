"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shadcn-ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog"
import { cn } from "@/lib/utils"

type PricingPlan = {
    id: string
    name: string
    subtitle: string
    price: string
    buttonText: string
    actionUrl: string
    selectId: string
    isHighlighted: boolean
    features: string[]
}

interface PricingCardProps {
    plan: PricingPlan
    onClick: (plan: PricingPlan) => void
    isLoading: boolean
    isSelected: boolean
}

const PricingCard = ({ plan, onClick, isLoading, isSelected }: PricingCardProps) => {
    return (
        <div
            className={cn(
                "flex flex-col p-6 rounded-lg border shadow-sm",
                "transition-all duration-200 hover:shadow-md cursor-pointer",
                plan.isHighlighted ? "border-primary shadow-md relative" : "border-border",
                isSelected && "ring-2 ring-primary ring-offset-2",
            )}
            onClick={() => onClick(plan)}
        >
            {plan.isHighlighted && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    Recommended
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
            </div>

            <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
            </div>

            <ul className="mb-6 space-y-2 flex-1">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                className={cn("mt-auto w-full", !plan.isHighlighted && "variant-outline")}
                variant={plan.isHighlighted ? "default" : "outline"}
                disabled={isLoading}
                onClick={(e) => {
                    e.stopPropagation()
                    onClick(plan)
                }}
            >
                {isLoading && isSelected ? (
                    <span className="flex items-center gap-2">
            <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
                ) : (
                    plan.buttonText
                )}
            </Button>
        </div>
    )
}

interface PricingDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function PricingDialog({ open: externalOpen, onOpenChange }: PricingDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const router = useRouter()
    
    // Use external state if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const handlePlanSelection = (plan: PricingPlan) => {
        setIsLoading(true)
        setSelectedId(plan.selectId)
        
        // Close the dialog
        setOpen(false)
        
        // Redirect to session creation with the selected plan
        router.push(`/session-setup?plan=${plan.id}`)
    }

    const pricingPlans = [
        {
            id: "free",
            name: "Free",
            subtitle: "100 voter limit",
            price: "$0.00",
            buttonText: "Create",
            actionUrl: "/session-creation?plan=free",
            selectId: "sub-free-001",
            isHighlighted: false,
            features: ["Poll voting only", "Standard verification", "Up to 100 voters", "No support"],
        },
        {
            id: "pro",
            name: "Pro",
            subtitle: "10,000 voter limit",
            price: "$49.99",
            buttonText: "Buy",
            actionUrl: "/session-creation?plan=pro",
            selectId: "sub-pro-001",
            isHighlighted: true,
            features: [
                "All voting types (polls, elections, tournement)",
                "KYC verification",
                "Full-time priority support",
                "Up to 10,000 voters",
            ],
        },
        {
            id: "enterprise",
            name: "Enterprise",
            subtitle: "Unlimited voters",
            price: "$199.99",
            buttonText: "Contact Sales",
            actionUrl: "/contact",
            selectId: "sub-ent-001",
            isHighlighted: false,
            features: [
                "Private blockchain deployment",
                "Unlimited voters and votes",
                "Full-time priority support",
                "Every Thing on pro",
            ],
        },
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Only render the DialogTrigger when not controlled externally */}
            {externalOpen === undefined && (
                <DialogTrigger asChild>
                    <Button size="lg">View Pricing Plans</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
                    <DialogDescription>
                        Select the plan that best fits your needs. Upgrade or downgrade at any time.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {pricingPlans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            onClick={handlePlanSelection}
                            isLoading={isLoading}
                            isSelected={selectedId === plan.selectId}
                        />
                    ))}
                </div>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>
                        Need help choosing?{" "}
                        <a href="/contact" className="underline text-primary hover:text-primary/90">
                            Contact our sales team
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
