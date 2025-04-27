"use client"

import { useEffect } from "react"
import { AuthDialog } from "@/components/auth"
import { useRouter } from "next/navigation"

export default function SignupPage() {
    const router = useRouter()
    
    // Auto-open the dialog when the page loads
    useEffect(() => {
        // If user navigates away from this page, they'll be redirected to home
        return () => {
            // This cleanup function will run when the component unmounts
        }
    }, [])

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <AuthDialog 
                open={true} 
                onOpenChange={(open) => {
                    if (!open) {
                        // Redirect to home page when dialog is closed
                        router.push('/')
                    }
                }}
                defaultTab="signup"
            />
        </div>
    )
}
