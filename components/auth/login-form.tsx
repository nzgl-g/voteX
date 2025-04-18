"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthFooter } from "@/components/auth/auth-footer"

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Handle login logic here
            console.log("Login attempt with:", { email })
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
            console.error("Login failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard
            title="Login"
            description="Enter your credentials to access your account"
            footer={
                <div className="w-full space-y-4">
                    <Button className="w-full" type="submit" form="login-form" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                    <AuthFooter text="Don't have an account?" linkText="Sign up" linkHref="/signup" />
                </div>
            }
        >
            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="sign-up-form.tsx" className="text-xs text-primary hover:underline">
                            Forgot your password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
            </form>
        </AuthCard>
    )
}
