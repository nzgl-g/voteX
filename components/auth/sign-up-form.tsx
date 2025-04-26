"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordInput } from "@/components/auth/password-input"
import { AuthFooter } from "@/components/auth/auth-footer"

type SignupFormData = {
    username: string
    email: string
    password: string
    confirmPassword: string
}

export function SignupForm() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setError: setFormError,
    } = useForm<SignupFormData>()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const onSubmit = async (data: SignupFormData) => {
        if (data.password !== data.confirmPassword) {
            setFormError('confirmPassword', {
                type: 'manual',
                message: 'Passwords do not match'
            })
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const { authApi } = await import('@/lib/api')
            const result = await authApi.signup(data.username, data.email, data.password)
            console.log('Signup successful:', result)
            
            // Check if there's a redirect destination stored in localStorage
            const redirectAfterLogin = localStorage.getItem('redirectAfterLogin')
            
            if (redirectAfterLogin) {
                // Clear the redirect info
                localStorage.removeItem('redirectAfterLogin')
                
                if (redirectAfterLogin === 'pricing') {
                    // Redirect to home page with pricing dialog
                    router.push('/?showPricing=true')
                } else if (redirectAfterLogin.startsWith('session-setup')) {
                    // Redirect to session creation with the plan parameter preserved
                    router.push(`/${redirectAfterLogin}`)
                } else {
                    // Handle any other redirects
                    router.push(`/${redirectAfterLogin}`)
                }
            } else {
                // Default redirect to dashboard
                router.push('/team-leader/monitoring')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign up. Please check your connection and try again.')
            console.error('Signup error:', err)
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
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <AuthFooter text="Already have an account?" linkText="Sign in" linkHref="/login" />
                </div>
            }
        >
            <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        {...register('username', { required: 'Username is required' })}
                    />
                    {errors.username && (
                        <p className="text-sm text-red-500">{errors.username.message}</p>
                    )}
                </div>
                
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        {...register('password', { 
                            required: 'Password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters long'
                            }
                        })}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword', { 
                            required: 'Please confirm your password'
                        })}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                </div>
            </form>
        </AuthCard>
    )
}
