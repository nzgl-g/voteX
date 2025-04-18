"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordInput } from "@/components/auth/password-input"
import { AuthFooter } from "@/components/auth/auth-footer"

export function SignupForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

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
            // Handle signup logic here
            console.log("Signup attempt with:", { email })
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
            console.error("Signup failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard
            title="Create an account"
            description="Enter your details to create a new account"
            footer={
                <div className="w-full space-y-4">
                    <Button className="w-full" type="submit" form="signup-form" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                    <AuthFooter text="Already have an account?" linkText="Sign in" linkHref="/login" />
                </div>
            }
        >
            <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
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

                <PasswordInput
                    id="password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    onBlur={validatePasswords}
                />

                <PasswordInput
                    id="confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    onBlur={validatePasswords}
                    error={passwordError}
                />
            </form>
        </AuthCard>
    )
}
