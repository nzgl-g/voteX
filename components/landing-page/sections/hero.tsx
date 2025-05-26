"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PricingDialog } from "@/components/pricing-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { authService } from "@/services";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "@/components/shared/user-profile";
import { motion } from "framer-motion";

export const HeroSection = () => {
  const { resolvedTheme, theme } = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState("/hero-image-light.png");
  const [mounted, setMounted] = useState(false);
  const [voterButtonLoading, setVoterButtonLoading] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ name: string; email: string; avatar?: string }>({ 
    name: "User", 
    email: "" 
  });
  
  // Function to check authentication status
  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const auth = authService.isAuthenticated();
      console.log('Authentication status checked:', auth);
      setIsAuthenticated(auth);
      return auth;
    }
    return false;
  };

  const getLogo = () => {
    if (theme === 'dark') {
      return "/logo/expended-dark.png";
    }
    return "/logo/expended.png";
  };
  
  useEffect(() => {
    // Mark as mounted
    setMounted(true);
    // Check authentication status on component mount
    const isAuth = checkAuth();
    
    // If user is authenticated, redirect to the appropriate dashboard
    if (isAuth) {
      // Get user from localStorage
      const user = authService.getCurrentUser();
      
      // In the new services structure, we need to access the role differently
      // It might be stored as a custom property or we need to determine it based on other properties
      let userRole = null;
      
      if (user) {
        // Try to get role from user object (could be stored in different ways)
        userRole = (user as any).role || localStorage.getItem('userRole');
        
        if (userRole) {
          switch (userRole.toLowerCase()) {
            case 'team-leader':
              router.push('/team-leader/monitoring/default');
              break;
            case 'team-member':
              router.push('/team-member/monitoring/default');
              break;
            default:
              router.push('/voter');
              break;
          }
        } else {
          // Default to voter portal if no role is found
          router.push('/voter');
        }
      } else {
        // Default to voter portal if no user is found
        router.push('/voter');
      }
    }

    // Fetch user data if authenticated
    const fetchUserData = async () => {
      if (isAuth) {
        try {
          const userProfile = await authService.fetchUserProfile();
          setUserData({
            name: userProfile.fullName || userProfile.username || "User",
            email: userProfile.email || "",
            avatar: userProfile.profilePic || undefined
          });
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };
    
    fetchUserData();
  }, [router]);
  
  // Handle theme changes in a separate effect to avoid hydration mismatch
  useEffect(() => {
    if (mounted) {
      setImageSrc(resolvedTheme === "dark" ? "/hero-image-dark.png" : "/hero-image-light.png");
    }
  }, [resolvedTheme, mounted]);

  return (
      <section className="container w-full">
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
            {isAuthenticated && (
              <UserProfile 
                userName={userData.name}
                userEmail={userData.email}
                userAvatar={userData.avatar}
                variant="dropdown"
                className="!rounded-full !bg-transparent !shadow-none !border-0"
              />
            )}
          </div>
        </motion.header>
        
        <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
          <div className="text-center space-y-8">
            <Badge variant="outline" className="text-sm py-2">
            <span className="mr-2 text-primary">
              <Badge>New</Badge>
            </span>
              <span> Blockchain Voting Platform Live </span>
            </Badge>

            <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
              <h1>
                Build trust with
                <span className="text-transparent px-2 bg-gradient-to-r from-[#6D28D9] to-primary bg-clip-text">
                secure & smart voting
              </span>
                infrastructure
              </h1>
            </div>

            <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
              A next-gen blockchain-based voting system with built-in KYC, team creation,
              task management, and real-time notifications. Your elections, redefined.
            </p>

            <div className="space-y-4 md:space-y-0 md:space-x-4">
              <Button 
                className="font-bold group/arrow"
                onClick={() => {
                  // Check auth status at the moment of click
                  const isAuth = checkAuth();
                  console.log('Create Session clicked, current auth status:', isAuth);
                  
                  if (isAuth) {
                    console.log('User is authenticated, showing pricing dialog');
                    // Directly show the pricing dialog
                    setShowPricingDialog(true);
                  } else {
                    console.log('User is not authenticated, showing auth dialog');
                    // Show the auth dialog first
                    setShowAuthDialog(true);
                  }
                }}
              >
                Create Vote Session
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>

              <Button
                  variant="secondary"
                  className="w-5/6 md:w-1/4 font-bold"
                  onClick={() => {
                    // Check auth status at the moment of click
                    const isAuth = checkAuth();
                    console.log('Voter Portal clicked, current auth status:', isAuth);
                    
                    if (isAuth) {
                      // Set loading state
                      setVoterButtonLoading(true);
                      console.log('User is authenticated, redirecting to voter page');
                      // Redirect to voter page
                      router.push('/voter');
                    } else {
                      console.log('User is not authenticated, showing auth dialog');
                      // Show the auth dialog with redirection to voter page after login
                      setRedirectAfterAuth('/voter');
                      setShowAuthDialog(true);
                    }
                  }}
                  disabled={voterButtonLoading}
              >
                {voterButtonLoading ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    Redirecting...
                  </>
                ) : (
                  "Go to Voter Portal"
                )}
              </Button>
            </div>

          </div>

          <div className="relative group mt-14">
            <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>
            <Image
                width={1200}
                height={1200}
                priority
                className="w-full md:w-[1200px] mx-auto rounded-lg relative leading-none flex items-center border border-t-2 border-secondary border-t-primary/30"
                src={imageSrc}
                alt="Blockchain Voting Dashboard"
            />

            <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
          </div>
        </div>

        {/* Pricing Dialog */}
        <PricingDialog
          open={showPricingDialog}
          onOpenChange={setShowPricingDialog}
        />

        {/* Auth Dialog */}
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={(open) => {
            setShowAuthDialog(open);
            // If auth dialog is closed and user is now authenticated
            if (!open && authService.isAuthenticated()) {
              // Refresh user data after authentication
              const fetchUserData = async () => {
                try {
                  const userProfile = await authService.fetchUserProfile();
                  setUserData({
                    name: userProfile.fullName || userProfile.username || "User",
                    email: userProfile.email || "",
                    avatar: userProfile.profilePic || undefined
                  });
                } catch (error) {
                  console.error("Failed to fetch user profile:", error);
                }
              };
              fetchUserData();
              
              if (redirectAfterAuth) {
                // Set loading state for voter button if redirecting there
                if (redirectAfterAuth === '/voter') {
                  setVoterButtonLoading(true);
                }
                // Redirect to the specified path after authentication
                router.push(redirectAfterAuth);
                // Reset the redirect path
                setRedirectAfterAuth(null);
              } else {
                // If no specific redirect, show pricing dialog (original behavior)
                setShowPricingDialog(true);
              }
            }
          }}
          defaultTab="login"
        />
      </section>
  );
};
