"use client";

import { VoteSessionForm } from "@/components/setup-form/vote-session-form";
import { ToastProvider } from "@/components/shadcn-ui/toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import { authApi } from "@/lib/api";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authenticated = authApi.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        // Store the current URL with plan parameter to redirect back after login
        const planParam = searchParams.get("plan");
        if (planParam) {
          localStorage.setItem('redirectAfterLogin', `session-creation?plan=${planParam}`);
        }
        
        // Redirect to login page
        router.push('/login');
      } else {
        // User is authenticated, check for plan parameter
        const planParam = searchParams.get("plan");
        
        if (planParam === "free" || planParam === "pro" || planParam === "enterprise") {
          setPlan(planParam);
        } else {
          // If no valid plan is in the URL, we'll keep plan as null
          setPlan(null);
        }
        
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [searchParams, router]);

  const handleBackToPricing = () => {
    router.push("/#subscription");
  };

  // If still loading or not authenticated, show loading state
  if (isLoading) {
    return (
      <ToastProvider>
        <main className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          </div>
        </main>
      </ToastProvider>
    );
  }
  
  return (
    <ToastProvider>
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Create Vote Session</h1>
        
        {plan ? (
          <VoteSessionForm plan={plan} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Please select a pricing plan first</h2>
            <p className="text-muted-foreground mb-6">You need to select a pricing plan before creating a vote session.</p>
            <Button onClick={handleBackToPricing}>Go to Pricing Plans</Button>
          </div>
        )}
      </main>
    </ToastProvider>
  );
}
