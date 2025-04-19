"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthFooter } from "@/components/auth/auth-footer"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Handle password reset logic here
            console.log("Password reset requested for:", email)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setIsSubmitted(true)
        } catch (error) {
            console.error("Password reset request failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard
            title="Forgot Password"
            description={
                isSubmitted
                    ? "Check your email for a link to reset your password"
                    : "Enter your email and we'll send you a link to reset your password"
            }
            footer={
                <div className="w-full space-y-4">
                    {!isSubmitted && (
                        <Button className="w-full" type="submit" form="forgot-password-form" disabled={isLoading}>
                            {isLoading ? "Sending link..." : "Send reset link"}
                        </Button>
                    )}
                    <AuthFooter text="Remember your password?" linkText="Back to login" linkHref="/login" />
                </div>
            }
        >
            {!isSubmitted ? (
                <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </form>
            ) : (
                <div className="py-4 text-center text-sm">
                    We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
                    instructions to reset your password.
                </div>
            )}
        </AuthCard>
    )
}
