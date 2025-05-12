"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { NotificationButton } from "@/components/shared/notification-button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import VotingSessionForm from "@/components/session-creation/voting-session-form";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function SessionSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise" | undefined>(undefined);
  const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({ 
      name: "User", 
      email: "" 
  });
  const { theme } = useTheme();

  const getLogo = () => {
    if (theme === 'dark') {
      return "/logo/expended-dark.png";
    }
    return "/logo/expended.png";
  };
  
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
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="mb-4 sticky top-4 z-50 mx-auto w-full container max-w-7xl xl:max-w-[1400px] rounded-full bg-background/80 shadow-lg backdrop-blur-md flex items-center justify-between px-4 py-2 border border-border transition-all"
        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <div className="relative h-8 w-32 flex items-center justify-center">
              <Image
                src={getLogo()}
                alt="Vote System Logo"
                width={128}
                height={32}
                className="object-contain select-none"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2 bg-muted/40 rounded-full px-2 py-1 transition-all">
          <ThemeToggle className="!rounded-full !bg-transparent !shadow-none !border-0" />
          <NotificationButton />
          <UserProfile 
            userName={userData.name}
            userEmail={userData.email}
            userAvatar={userData.avatar}
            variant="dropdown"
            className="!rounded-full !bg-transparent !shadow-none !border-0"
          />
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto max-w-7xl xl:max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <VotingSessionForm
            subscription={plan === "enterprise" ? "pro" : (plan as "free" | "pro") || "free"}
            onSuccess={handleSessionCreated}
          />
      </main>
    </div>
  );
}
