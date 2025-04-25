"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthFooter } from "@/components/auth/auth-footer"

type LoginFormData = {
    email: string
    password: string
}

export function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError(null)
        
        try {
            const { authApi } = await import('@/lib/api')
            const result = await authApi.login(data.email, data.password)
            console.log('Login successful:', result)
            router.push('/team-leader/real-time-analytics') // Redirect to dashboard after successful login
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials and try again.')
            console.error('Login error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard
            title="Welcome back"
            description="Enter your credentials to access your account"
            footer={
                <div className="w-full space-y-4">
                    <Button className="w-full" type="submit" form="login-form" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <AuthFooter text="Don't have an account?" linkText="Sign up" linkHref="/sign-up" />
                </div>
            }
        >
            <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        {...register('email', { 
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>
                
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                            Forgot your password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        {...register('password', { 
                            required: 'Password is required'
                        })}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>
            </form>
        </AuthCard>
    )
}
