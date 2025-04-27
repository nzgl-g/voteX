"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentForm } from "@/components/payment-page"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/shadcn-ui/toaster"
import { authApi } from "@/lib/api"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [planPrice, setPlanPrice] = useState<number>(49.99) // Default Pro plan price
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = authApi.isAuthenticated()
    if (!isAuthenticated) {
      // Store the current URL to redirect back after login
      const currentUrl = window.location.pathname + window.location.search
      localStorage.setItem('redirectAfterLogin', currentUrl.substring(1)) // Remove leading slash
      router.push('/login')
      return
    }
    
    // Get session ID from URL
    const id = searchParams.get('sessionId')
    if (!id) {
      toast({
        title: "Error",
        description: "No session ID provided. Please try again.",
        variant: "destructive",
      })
      router.push('/team-leader/monitoring')
      return
    }
    
    setSessionId(id)
    
    // Get plan from URL if available
    const plan = searchParams.get('plan')
    if (plan === 'pro') {
      setPlanPrice(49.99)
    } else if (plan === 'enterprise') {
      setPlanPrice(199.99)
    }
    
    setIsLoading(false)
  }, [router, searchParams])
  
  const handlePaymentSuccess = () => {
    // In a real application, you would update the session's payment status on the server
    console.log('Payment successful for session:', sessionId)
    
    // Redirect to monitoring dashboard with session ID
    router.push(`/team-leader/monitoring/${sessionId}`)
  }
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading payment details...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your payment information.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <Toaster />
      <h1 className="text-3xl font-bold mb-2 text-center">Complete Your Purchase</h1>
      <p className="text-muted-foreground text-center mb-8">
        Your vote session is ready! Complete the payment to activate it.
      </p>
      
      <PaymentForm 
        onSuccess={handlePaymentSuccess}
        totalAmount={planPrice}
      />
    </div>
  )
}
