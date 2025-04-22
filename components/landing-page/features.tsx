"use client"

import type React from "react"

import { useState } from "react"
import { Lock, Zap, BarChart3, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border p-6 text-center transition-all",
        isHovered && "translate-y-[-4px] shadow-lg",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
    >
      <div className={cn("mb-4 rounded-full p-2 text-muted-foreground transition-colors", isHovered && "text-primary")}>
        {icon}
      </div>
      <h3 className={cn("mb-2 text-xl font-semibold transition-colors", isHovered && "text-primary")}>{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function Features() {
  const features = [
    {
      icon: <Lock className="h-16 w-16" />,
      title: "Secure Login",
      description: "Multi-factor authentication keeps your votes safe.",
    },
    {
      icon: <Zap className="h-16 w-16" />,
      title: "One-Click Session Creation",
      description: "Set up your voting session in seconds, not minutes.",
    },
    {
      icon: <BarChart3 className="h-16 w-16" />,
      title: "Real-Time Results",
      description: "Watch votes come in live with beautiful visualizations.",
    },
    {
      icon: <Shield className="h-16 w-16" />,
      title: "Role-Based Access",
      description: "Control who can create, vote, and view results.",
    },
  ]

  return (
    <section className="py-12 md:py-24 lg:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Key Features</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to make group decisions quickly and fairly.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16 mt-12">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </div>
    </section>
  )
}
