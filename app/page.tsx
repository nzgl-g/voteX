"use client";

import { HeroSection } from "@/components/landing-page/sections/hero";
import { FeaturesSection } from "@/components/landing-page/sections/features";
import { ProblemSection } from "@/components/landing-page/sections/problems";
import { TestimonialSection } from "@/components/landing-page/sections/testimonial";
import { PricingSection } from "@/components/landing-page/sections/pricing";
import { FAQSection } from "@/components/landing-page/sections/faq";
import { ContactSection } from "@/components/landing-page/sections/contact";
import { FooterSection } from "@/components/landing-page/sections/footer";
import { PricingDialog } from "@/components/pricing-dialog";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Navbar } from "@/components/landing-page/navbar";
import { LandingSkeleton } from "@/components/landing-page/landing-skeleton";

// Create a separate component for the main content
const LandingPageContent = () => {
  const searchParams = useSearchParams();
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  
  useEffect(() => {
    // Check if we should show the pricing dialog based on URL parameter
    if (searchParams.get("showPricing") === "true") {
      setShowPricingDialog(true);
    }
    
    // Add event listener for custom event from Hero component
    const handleShowPricingDialog = () => {
      console.log('Custom event received, showing pricing dialog');
      setShowPricingDialog(true);
    };
    
    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('showPricingDialog', handleShowPricingDialog);
    }
    
    // Clean up event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('showPricingDialog', handleShowPricingDialog);
      }
    };
  }, [searchParams]);
  
  return (
    <>
      <header>
        <Navbar/>
      </header>
      <main className="flex-1 flex flex-col items-center w-full landing-page">
        <div className="w-full max-w-screen-xl mx-auto">
          <HeroSection/>
          <FeaturesSection/>
          <ProblemSection/>
          <div id="testimonials" className="flex-1 flex flex-col items-center w-full">
            <TestimonialSection/>
          </div>
          <div id="pricing" className="flex-1 flex flex-col items-center w-full">
            <PricingSection/>
          </div>
          <div id="faq" className="flex-1 flex flex-col items-center w-full">
            <FAQSection/>
          </div>
          <div id="contact" className="flex-1 flex flex-col items-center w-full">
            <ContactSection/>
          </div>
        </div>
      </main>
      <div className="flex-1 flex flex-col items-center w-full">
        <FooterSection />
      </div>
      
      {/* Pricing dialog that can be triggered from URL parameter */}
      <PricingDialog 
        open={showPricingDialog} 
        onOpenChange={setShowPricingDialog} 
      />
    </>
  );
};

// Main component with Suspense
export default function Home() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingPageContent />
    </Suspense>
  );
}
