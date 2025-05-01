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
} from "@/components/shadcn-ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn-ui/tabs"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"

// Login form types
type LoginFormData = {
  email: string
  password: string
}

// Signup form types
type SignupFormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
  gender: string
  fullName?: string
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
      const { authApi } = await import('@/lib/api')
      const result = await authApi.login(data.email, data.password)
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
          const response = await fetch('/api/sessions/my-sessions')
          const sessions = await response.json()
          
          if (sessions && sessions.length > 0) {
            // User has team leader sessions, redirect to the first one
            router.push(`/team-leader/monitoring/${sessions[0]._id}`)
          } else {
            // Check if user has team member sessions
            const memberResponse = await fetch('/api/sessions/my-sessions-as-member')
            const memberData = await memberResponse.json()
            
            if (memberData.sessions && memberData.sessions.length > 0) {
              // User has team member sessions, redirect to the first one
              router.push(`/team-member/monitoring/${memberData.sessions[0]._id}`)
            } else {
              // User has no sessions, redirect to voter portal
              router.push('/voter')
            }
          }
        } catch (error) {
          console.error('Error fetching sessions:', error)
          // Default fallback if session fetch fails
          router.push('/voter')
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login. Please check your credentials and try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoginLoading(false)
    }
  }

  // Handle signup submission
  const onSignupSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      setSignupFormError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      })
      return
    }

    setIsSignupLoading(true)
    setSignupError(null)

    try {
      const { authApi } = await import('@/lib/api')
      const result = await authApi.signup(
        data.username, 
        data.email, 
        data.password, 
        data.gender,
        data.fullName
      )
      console.log('Signup successful:', result)
      
      // Check if signup is triggered from navbar
      const navbarSignup = localStorage.getItem('navbarSignup') === 'true'
      // Check if there's a redirect destination stored in localStorage
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin')
      
      handleDialogClose()
      
      if (navbarSignup) {
        localStorage.removeItem('navbarSignup')
        router.push('/voter')
      } else if (redirectAfterLogin) {
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
        // After signup, always redirect to voter portal
        router.push('/voter')
      }
    } catch (err: any) {
      setSignupError(err.message || 'Failed to sign up. Please check your connection and try again.')
      console.error('Signup error:', err)
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
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
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
              <div className="grid gap-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="johndoe"
                  {...registerSignup('username', { required: 'Username is required' })}
                />
                {signupErrors.username && (
                  <p className="text-sm text-destructive">{signupErrors.username.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  {...registerSignup('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {signupErrors.email && (
                  <p className="text-sm text-destructive">{signupErrors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="signup-fullname">Full Name (Optional)</Label>
                <Input
                  id="signup-fullname"
                  type="text"
                  placeholder="John Doe"
                  {...registerSignup('fullName')}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="signup-gender">Gender</Label>
                <select
                  id="signup-gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...registerSignup('gender', { required: 'Gender is required' })}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {signupErrors.gender && (
                  <p className="text-sm text-destructive">{signupErrors.gender.message}</p>
                )}
              </div>

              <div className="grid gap-2">
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

              <div className="grid gap-2">
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
