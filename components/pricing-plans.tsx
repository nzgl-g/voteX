import {Button} from "@/components/shadcn-ui/button";
import {BadgeCheck, Building, Check, ChevronRight, FileText, Lock, Shield, Users, X} from "lucide-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/shadcn-ui/card";
import {Badge} from "@/components/shadcn-ui/badge";

interface PlanFeature {
    text: string;
    included: boolean;
    icon?: React.ReactNode;
}

interface PricingPlan {
    id: string;
    name: string;
    description: string;
    price: string;
    period?: string;
    buttonText: string;
    buttonVariant: "outline" | "default" | "secondary";
    features: PlanFeature[];
    popularPlan?: boolean;
    recommendation?: string;
    accent?: string;
}

interface PricingPlansProps {
    onPlanSelect?: (plan: string) => void;
}

export default function PricingPlans({onPlanSelect}: PricingPlansProps) {
    const plans: PricingPlan[] = [
        {
            id: "free",
            name: "Free Plan",
            description: "Perfect for trying out basic voting",
            price: "Free",
            buttonText: "Get Started",
            buttonVariant: "outline",
            accent: "bg-muted/50",
            recommendation: "Small communities, informal decisions, testing the platform",
            features: [
                {text: "Poll voting only", included: true, icon: <FileText className="w-4 h-4 text-primary"/>},
                {text: "Up to 100 voters", included: true, icon: <Users className="w-4 h-4 text-primary"/>},
                {text: "Standard verification", included: true, icon: <BadgeCheck className="w-4 h-4 text-primary"/>},
                {text: "No support", included: false, icon: <X className="w-4 h-4 text-destructive"/>},
            ]
        },
        {
            id: "pro",
            name: "Pro Plan",
            description: "For growing teams and serious decision-making",
            price: "$49",
            period: "per session",
            buttonText: "Upgrade Now",
            buttonVariant: "default",
            popularPlan: true,
            accent: "bg-primary/5",
            recommendation: "Companies, organizations, events, and secure digital governance",
            features: [
                {
                    text: "All voting types (polls, elections, referendums, etc.)",
                    included: true,
                    icon: <FileText className="w-4 h-4 text-primary"/>
                },
                {text: "Up to 10,000 voters", included: true, icon: <Users className="w-4 h-4 text-primary"/>},
                {text: "KYC verification", included: true, icon: <Shield className="w-4 h-4 text-primary"/>},
                {text: "Full-time priority support", included: true, icon: <Check className="w-4 h-4 text-primary"/>},
            ]
        },
        {
            id: "enterprise",
            name: "Enterprise Plan",
            description: "Tailored for large-scale, high-security operations",
            price: "Contact Sales",
            buttonText: "Contact Us",
            buttonVariant: "secondary",
            accent: "bg-secondary/50",
            recommendation: "Governments, large enterprises, or mission-critical voting scenarios",
            features: [
                {text: "Private blockchain deployment", included: true, icon: <Lock className="w-4 h-4 text-primary"/>},
                {text: "Unlimited voters and votes", included: true, icon: <Users className="w-4 h-4 text-primary"/>},
                {text: "All advanced voting types", included: true, icon: <FileText className="w-4 h-4 text-primary"/>},
                {text: "Advanced KYC verification", included: true, icon: <Shield className="w-4 h-4 text-primary"/>},
                {
                    text: "Dedicated full-time support & onboarding",
                    included: true,
                    icon: <Building className="w-4 h-4 text-primary"/>
                },
            ]
        }
    ];

    return (
        <div className="container px-4 py-12 mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Choose Your Plan</h2>
                <p className="text-muted-foreground mx-auto max-w-3xl">
                    Select the perfect voting solution for your needs. From small community decisions to large-scale
                    secure elections.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <div key={index} className="relative">
                        {plan.popularPlan && (
                            <Badge
                                variant="default"
                                className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 z-10"
                            >
                                Popular
                            </Badge>
                        )}
                        <Card
                            className={`flex flex-col h-full border transition-all duration-200 hover:shadow-md ${plan.accent} ${plan.popularPlan ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
                            <CardHeader className="pb-8">
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="pt-1.5">{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                      <span className="mr-2 mt-0.5">
                        {feature.icon || (feature.included ? <Check className="w-4 h-4 text-primary"/> :
                            <X className="w-4 h-4 text-destructive"/>)}
                      </span>
                                            <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.recommendation && (
                                    <div className="mt-6 pt-4 border-t">
                                        <p className="text-sm font-medium">Great for:</p>
                                        <p className="text-sm text-muted-foreground">{plan.recommendation}</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button
                                    variant={plan.buttonVariant}
                                    className="w-full group"
                                    onClick={() => {
                                        onPlanSelect?.(plan.id.toLowerCase().split(' ')[0]);
                                        window.location.href = `/session-creation?plan=${plan.id}`;
                                    }}
                                >
                                    {plan.buttonText}
                                    <ChevronRight
                                        className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"/>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="text-center mt-16">
                <p className="text-sm text-muted-foreground">
                    All plans include our core voting infrastructure, security, and 99.9% uptime guarantee.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Need a custom solution? <Button variant="link" className="p-0 h-auto font-normal">Contact our sales
                    team</Button>
                </p>
            </div>
        </div>
    );
}
