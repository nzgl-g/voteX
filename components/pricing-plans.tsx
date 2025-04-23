"use client";

import { CheckIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn-ui/button";
import { useRouter } from "next/navigation";

// Extracted pricing plan data
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
        features: [
            "Poll voting only",
            "Standard verification",
            "Up to 100 voters",
            "No support"
        ]
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
            "Up to 10,000 voters"
        ]
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
            "Every Thing on pro"
        ]
    }
];

export function PricingSection() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handlePlanSelection = (plan: typeof pricingPlans[0]) => {
        setIsLoading(true);
        setSelectedId(plan.selectId);
        router.push(plan.actionUrl);
    };

    return (
        <section id="pricing">
            <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-14 md:px-8">
                <div className="mx-auto max-w-5xl text-center">
                    <h4 className="text-xl font-bold tracking-tight text-black dark:text-white">
                        Pricing Plans
                    </h4>
                </div>

                <div className="mx-auto grid w-full flex-col justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pricingPlans.map((plan, index) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex max-w-[400px] flex-col gap-8 overflow-hidden rounded-2xl border p-4 text-black dark:text-white",
                                {
                                    "border-2 border-[var(--color-one)] dark:border-[var(--color-one)]": plan.isHighlighted,
                                }
                            )}
                        >
                            <div className="flex items-center">
                                <div className="ml-4">
                                    <h2 className="text-base font-semibold leading-7">{plan.name}</h2>
                                    <p className="text-sm leading-5 text-black/70 dark:text-white">
                                        {plan.subtitle}
                                    </p>
                                </div>
                            </div>

                            <motion.div
                                key={plan.selectId}
                                initial="initial"
                                animate="animate"
                                variants={{
                                    initial: { opacity: 0, y: 12 },
                                    animate: { opacity: 1, y: 0 },
                                }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.1 + index * 0.05,
                                    ease: [0.21, 0.47, 0.32, 0.98],
                                }}
                                className="flex flex-row gap-1"
                            >
                <span className="text-4xl font-bold text-black dark:text-white">
                  {plan.price}
                    <span className="text-xs"> /session</span>
                </span>
                            </motion.div>

                            <Button
                                className={cn(
                                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2"
                                )}
                                disabled={isLoading}
                                onClick={() => handlePlanSelection(plan)}
                            >
                <span
                    className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform-gpu bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-96 dark:bg-black"
                />
                                {!isLoading || selectedId !== plan.selectId ? (
                                    <p>{plan.buttonText}</p>
                                ) : (
                                    <p>{plan.id === "enterprise" ? "Redirecting" : "Creating"}</p>
                                )}
                                {isLoading && selectedId === plan.selectId && (
                                    <Loader className="mr-2 size-4 animate-spin" />
                                )}
                            </Button>

                            <hr className="m-0 h-px w-full border-none bg-gradient-to-r from-neutral-200/0 via-neutral-500/30 to-neutral-200/0" />
                            <ul className="flex flex-col gap-2 font-normal">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={`${plan.id}-feature-${featureIndex}`} className="flex items-center gap-3 text-xs font-medium text-black dark:text-white">
                                        <CheckIcon
                                            className="size-5 shrink-0 rounded-full bg-green-400 p-[2px] text-black dark:text-white"
                                        />
                                        <span className="flex">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}