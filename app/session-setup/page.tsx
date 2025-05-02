"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shadcn-ui/button";
import { VoteSessionForm } from "@/components/setup-form/vote-session-form";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function SessionSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise" | undefined>(undefined);
  const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({ 
      name: "User", 
      email: "" 
  });
  
  useEffect(() => {
    // Get plan from URL parameters
    const planParam = searchParams.get("plan");
    console.log("Plan parameter detected in URL:", planParam);
    
    if (planParam && ["free", "pro", "enterprise"].includes(planParam)) {
      console.log("Setting plan to:", planParam);
      setPlan(planParam as "free" | "pro" | "enterprise");
    } else {
      // Default to free if no plan specified
      console.log("No valid plan detected, defaulting to free");
      setPlan("free");
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userProfile = await authApi.fetchUserProfile();
        setUserData({
          name: userProfile.name || "User",
          email: userProfile.email || "",
          avatar: userProfile.avatar || undefined
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    
    fetchUserData();
  }, [searchParams]);

  const handleSessionCreated = () => {
    toast.success("Session created successfully!");
    router.push("/voter");
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <div className="hidden dark:block">
                <Image src="/logo/expended-dark.png" alt="Vote System Logo" width={120} height={40} className="mr-2" />
              </div>
              <div className="block dark:hidden">
                <Image src="/logo/expended.png" alt="Vote System Logo" width={120} height={40} className="mr-2" />
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/voter")}
              className="mr-2 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sessions
            </Button>
            <ThemeToggle />
            <UserProfile 
              userName={userData.name}
              userEmail={userData.email}
              userAvatar={userData.avatar}
              variant="dropdown"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Create Vote Session</h1>
          <VoteSessionForm 
            plan={plan} 
            onComplete={handleSessionCreated}
          />
        </div>
      </main>
    </div>
  );
}
