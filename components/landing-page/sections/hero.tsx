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
import { authService } from "@/services";

export const HeroSection = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState("/hero-image-light.jpeg");
  const [mounted, setMounted] = useState(false);
  
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
  }, [router]);
  
  // Handle theme changes in a separate effect to avoid hydration mismatch
  useEffect(() => {
    if (mounted) {
      setImageSrc(resolvedTheme === "dark" ? "/hero-image-dark.jpeg" : "/hero-image-light.jpeg");
    }
  }, [resolvedTheme, mounted]);

  return (
      <section className="container w-full">
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
                    // Directly show the pricing dialog from the parent page
                    window.dispatchEvent(new CustomEvent('showPricingDialog'));
                    // Stay on the same page
                  } else {
                    console.log('User is not authenticated, redirecting to login');
                    // Store intended destination in localStorage to resume flow after login
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('redirectAfterLogin', 'pricing');
                      // Use direct navigation to ensure the page fully reloads
                      window.location.href = '/login';
                    } else {
                      // Fallback to router if window is not available
                      router.push('/login');
                    }
                  }
                }}
              >
                Create Vote Session
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>

              <Button
                  asChild
                  variant="secondary"
                  className="w-5/6 md:w-1/4 font-bold"
              >
                <Link
                    href="/voter"
                    target="_blank"
                >
                  Go to Voter Portal
                </Link>
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
      </section>
  );
};
