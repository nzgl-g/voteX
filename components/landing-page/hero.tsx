"use client"

import {useState} from "react"
import Link from "next/link"
import {Button} from "@/components/shadcn-ui/button"
import {Play} from "lucide-react"
import {cn} from "@/lib/utils"

export default function Hero() {
    const [hasBouncedCreate, setHasBouncedCreate] = useState(false)
    const [hasBouncedVote, setHasBouncedVote] = useState(false)
    const [isGiggling, setIsGiggling] = useState(false)

    const handleCreateHover = () => {
        if (!hasBouncedCreate) {
            setHasBouncedCreate(true)
        }
    }

    const handleVoteHover = () => {
        if (!hasBouncedVote) {
            setHasBouncedVote(true)
        }
    }

    const handleDemoFocus = () => {
        setIsGiggling(true)
        setTimeout(() => setIsGiggling(false), 500)
    }

    return (
        <section className="py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl lg:text-[48px]">
                                Democratize Your Decisions in Seconds
                            </h1>
                            <p className="text-lg text-muted-foreground md:text-xl">
                                Create sessions, invite voters, and see real-time results.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row">
                            <Button
                                size="lg"
                                className={cn("rounded-2xl transition-all", hasBouncedCreate && "hover:animate-bounce")}
                                onMouseEnter={handleCreateHover}
                                onClick={() => window.location.href = "/subscription"}
                            >
                                Create Session
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className={cn("rounded-2xl transition-all", hasBouncedVote && "hover:animate-bounce")}
                                onMouseEnter={handleVoteHover}
                                aria-label="Vote on an existing session"
                            >
                                Vote on Session
                            </Button>
                        </div>
                        <div className="pt-4">
                            <Link
                                href="#demo"
                                className={cn(
                                    "inline-flex items-center text-primary underline-offset-4 hover:underline focus:outline-none",
                                    isGiggling && "animate-wiggle",
                                )}
                                onFocus={handleDemoFocus}
                            >
                                <Play className="mr-2 h-4 w-4"/>
                                Watch Demo
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative h-[300px] w-full max-w-[500px] overflow-hidden rounded-lg">
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                                {/* This would be a Lottie animation in production */}
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/20 p-4">
                                        <div className="h-full w-full rounded-full bg-primary"></div>
                                    </div>
                                    <div className="h-24 w-1 bg-primary/50"></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className="h-4 w-4 rounded-sm bg-primary/20"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
