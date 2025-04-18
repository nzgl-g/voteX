"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordInput } from "@/components/auth/password-input"
import { AuthFooter } from "@/components/auth/auth-footer"

export function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const validatePasswords = () => {
        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters long")
            return false
        }

        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match")
            return false
        }

        setPasswordError("")
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validatePasswords()) {
            return
        }

        setIsLoading(true)

        try {
            // Handle password reset logic here
            console.log("Password reset with new password")
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setIsSubmitted(true)
        } catch (error) {
            console.error("Password reset failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard
            title="Reset Password"
            description={isSubmitted ? "Your password has been reset successfully" : "Create a new password for your account"}
            footer={
                <div className="w-full space-y-4">
                    {!isSubmitted ? (
                        <Button className="w-full" type="submit" form="reset-password-form" disabled={isLoading}>
                            {isLoading ? "Resetting password..." : "Reset password"}
                        </Button>
                    ) : (
                        <Button className="w-full" href="./login" asChild>
                            <a>Return to login</a>
                        </Button>
                    )}
                    <AuthFooter text="Remember your password?" linkText="Back to login" linkHref="/login" />
                </div>
            }
        >
            {!isSubmitted ? (
                <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
                    <PasswordInput
                        id="password"
                        label="New Password"
                        value={password}
                        onChange={setPassword}
                        onBlur={validatePasswords}
                    />

                    <PasswordInput
                        id="confirm-password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        onBlur={validatePasswords}
                        error={passwordError}
                    />
                </form>
            ) : (
                <div className="py-4 text-center text-sm">
                    Your password has been reset successfully. You can now log in with your new password.
                </div>
            )}
        </AuthCard>
    )
}
