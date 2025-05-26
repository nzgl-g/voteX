"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionTabs from "@/components/voter-portal/session-profile/profile";
import sessionService from "@/services/session-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { VoterHeader } from "@/components/voter-portal";

export default function SessionProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const sessionId = params.id as string;
        const sessionData = await sessionService.getSessionById(sessionId);
        setSession(sessionData);
      } catch (err: any) {
        console.error("Error fetching session:", err);
        setError(err.message || "Failed to load session");
        toast({
          title: "Error",
          description: "Failed to load session details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSession();
    }
  }, [params.id]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Voter Header */}
      <VoterHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {/* Back Button and Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Session Details
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : error || !session ? (
          <div className="p-8 text-center max-w-3xl mx-auto bg-muted/20 rounded-lg border border-muted">
            <h2 className="text-2xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The session you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Button onClick={handleBack}>
              Return to Voter Portal
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <SessionTabs session={session} />
          </div>
        )}
      </main>
    </div>
  );
} 