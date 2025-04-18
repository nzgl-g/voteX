import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import React from 'react';
import {cn} from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
        <AnimatedGridPattern
            numSquares={30}
            maxOpacity={2}
            duration={3}
            repeatDelay={1}
            className={cn(
                "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
            )}/>
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-3xl">
                    {children}
                </div>
            </div>
        </>
    )
}