"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sessionService } from "@/services/session-service"
import { authService } from "@/services/auth-service"

// Login form types
type LoginFormData = {
  email: string
  password: string
}
// TODO: Add add user fileds to the form
// Signup form types
type SignupFormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
  gender: string
  fullName?: string
  nationality: string
  dateOfBirth: string
}

interface AuthDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTab?: "login" | "signup"
  trigger?: React.ReactNode
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
  trigger,
}: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab)
  const router = useRouter()

  // Login form state
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormData>()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Signup form state
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    setError: setSignupFormError,
    reset: resetSignupForm,
  } = useForm<SignupFormData>()
  const [signupError, setSignupError] = useState<string | null>(null)
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "signup")
    setLoginError(null)
    setSignupError(null)
  }

  // Handle dialog close
  const handleDialogClose = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
    // Reset forms with a delay to avoid visual glitches
    setTimeout(() => {
      resetLoginForm()
      resetSignupForm()
      setLoginError(null)
      setSignupError(null)
    }, 300)
  }

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoginLoading(true)
    setLoginError(null)
    
    try {
      // Use the new authService instead of the old authApi
      const result = await authService.login({
        email: data.email,
        password: data.password
      })
      console.log('Login successful:', result)
      
      // Check if there's a redirect destination stored in localStorage
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin')
      
      handleDialogClose()
      
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
        // Fetch user sessions to determine where to redirect
        try {
          // First check if user has team leader sessions
          const sessions = await sessionService.getUserSessions();
          
          if (sessions && sessions.length > 0) {
            // User has team leader sessions, redirect to the first one
            router.push(`/team-leader/session/${sessions[0]._id}`)
          } else {
            // Check if user has team member sessions
            const memberData = await sessionService.getUserSessionsAsMember();
            
            if (memberData.sessions && memberData.sessions.length > 0) {
              // User has team member sessions, redirect to the first one
              router.push(`/team-member/session/${memberData.sessions[0]._id}`)
            } else {
              // User has no sessions, redirect to dashboard
              router.push('/voter')
            }
          }
        } catch (error) {
          console.error('Error fetching sessions:', error)
          // Fallback to dashboard on error
          router.push('/voter')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(error.message || 'Login failed. Please check your credentials and try again.')
    } finally {
      setIsLoginLoading(false)
    }
  }

  // Handle signup submission
  const onSignupSubmit = async (data: SignupFormData) => {
    setIsSignupLoading(true)
    setSignupError(null)
    
    // Check if passwords match
    if (data.password !== data.confirmPassword) {
      setSignupFormError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      })
      setIsSignupLoading(false)
      return
    }
    
    try {
      // Use the new authService instead of the old authApi
      const result = await authService.signup({
        username: data.username,
        email: data.email,
        password: data.password,
        gender: data.gender,
        fullName: data.fullName,
        nationality: data.nationality,
        dateOfBirth: data.dateOfBirth,
      })
      
      console.log('Signup successful:', result)
      handleDialogClose()
      
      // Check if there's a redirect destination stored in localStorage
      const redirectAfterSignup = localStorage.getItem('redirectAfterLogin')
      
      if (redirectAfterSignup) {
        // Clear the redirect info
        localStorage.removeItem('redirectAfterLogin')
        
        if (redirectAfterSignup === 'pricing') {
          // Redirect to home page with pricing dialog
          router.push('/?showPricing=true')
        } else if (redirectAfterSignup.startsWith('session-setup')) {
          // Redirect to session creation with the plan parameter preserved
          router.push(`/${redirectAfterSignup}`)
        } else {
          // Handle any other redirects
          router.push(`/${redirectAfterSignup}`)
        }
      } else {
        // Redirect to dashboard after signup
        router.push('/voter')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setSignupError(error.message || 'Signup failed. Please try again.')
    } finally {
      setIsSignupLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {activeTab === "login" ? "Welcome back" : "Create an account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "login"
              ? "Enter your credentials to access your account"
              : "Enter your details to create a new account"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          {/* Login Tab Content */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  {...registerLogin('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {loginErrors.email && (
                  <p className="text-sm text-destructive">{loginErrors.email.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  {...registerLogin('password', { 
                    required: 'Password is required'
                  })}
                />
                {loginErrors.password && (
                  <p className="text-sm text-destructive">{loginErrors.password.message}</p>
                )}
              </div>
              
              {loginError && (
                <p className="text-sm text-destructive text-center">{loginError}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoginLoading}>
                {isLoginLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          
          {/* Signup Tab Content */}
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  {...registerSignup("username", { required: "Username is required" })}
                />
                {signupErrors.username && (
                  <p className="text-red-500 text-sm">{signupErrors.username.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  {...registerSignup("email", { required: "Email is required" })}
                />
                {signupErrors.email && (
                  <p className="text-red-500 text-sm">{signupErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-fullName">Full Name</Label>
                <Input
                  id="signup-fullName"
                  {...registerSignup("fullName", { required: "Full name is required" })}
                />
                {signupErrors.fullName && (
                  <p className="text-red-500 text-sm">{signupErrors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-gender">Gender</Label>
                <select
                  id="signup-gender"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...registerSignup("gender", { required: "Gender is required" })}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {signupErrors.gender && (
                  <p className="text-red-500 text-sm">{signupErrors.gender.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-nationality">Nationality</Label>
                <Input
                  id="signup-nationality"
                  {...registerSignup("nationality", { required: "Nationality is required" })}
                />
                {signupErrors.nationality && (
                  <p className="text-red-500 text-sm">{signupErrors.nationality.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-dateOfBirth">Date of Birth</Label>
                <Input
                  id="signup-dateOfBirth"
                  type="date"
                  {...registerSignup("dateOfBirth", { required: "Date of Birth is required" })}
                />
                {signupErrors.dateOfBirth && (
                  <p className="text-red-500 text-sm">{signupErrors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  {...registerSignup('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters long'
                    }
                  })}
                />
                {signupErrors.password && (
                  <p className="text-sm text-destructive">{signupErrors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  {...registerSignup('confirmPassword', { 
                    required: 'Please confirm your password'
                  })}
                />
                {signupErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupErrors.confirmPassword.message}</p>
                )}
              </div>
              
              {signupError && (
                <p className="text-sm text-destructive text-center">{signupError}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={isSignupLoading}>
                {isSignupLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
