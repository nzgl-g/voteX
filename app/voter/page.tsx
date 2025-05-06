"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Session } from "@/api/session-service";
import { sessionService } from "@/api/session-service";
import { Badge } from "@/components/shadcn-ui/badge";
import { Button } from "@/components/shadcn-ui/button";
import { UserProfile } from "@/components/shared/user-profile";
import CandidateFormDialog from "@/components/voter-portal/candidate-form-dialog";
import { candidateService } from "@/api/candidate-service";
import { Calendar, Clock, Users, Flag, Plus, Key } from "lucide-react";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn-ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn-ui/dialog";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Bell } from "lucide-react";
import useNotification, { NotificationPayload } from "@/hooks/use-notification";
import { PricingDialog } from "@/components/pricing-dialog";
import { toast } from "sonner";

export default function VoterPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hiddenSessions, setHiddenSessions] = useState<Session[]>([]);
  const [publicSessions, setPublicSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showSecretPhraseDialog, setShowSecretPhraseDialog] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState("");
  const [isSubmittingPhrase, setIsSubmittingPhrase] = useState(false);
  const { theme } = useTheme();
  
  // Notification hook (using userId "current-user-id" as placeholder)
  const userId = "current-user-id";
  const { notifications, markAsRead } = useNotification(userId);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const allSessions = await sessionService.getAllSessions();
        setSessions(allSessions);
        
        // Separate public and secret phrase sessions
        const public_sessions = allSessions.filter(session => 
          session.securityMethod !== 'Secret Phrase'
        );
        const secret_sessions = allSessions.filter(session => 
          session.securityMethod === 'Secret Phrase'
        );
        
        setPublicSessions(public_sessions);
        setHiddenSessions(secret_sessions);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const getSessionLifecycleStatus = (session: Session) => {
    const now = new Date();
    const scheduledStart = session.sessionLifecycle.scheduledAt.start ? new Date(session.sessionLifecycle.scheduledAt.start) : null;
    const scheduledEnd = session.sessionLifecycle.scheduledAt.end ? new Date(session.sessionLifecycle.scheduledAt.end) : null;
    const startedAt = session.sessionLifecycle.startedAt ? new Date(session.sessionLifecycle.startedAt) : null;
    const endedAt = session.sessionLifecycle.endedAt ? new Date(session.sessionLifecycle.endedAt) : null;

    // Ended if current time is after end date
    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-destructive/50 hover:bg-destructive/60"
      };
    }

    // Started if current time is between start date and end date
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "started",
        label: "Active",
        color: "bg-primary hover:bg-primary/90"
      };
    }

    // Nomination if the scheduled time is defined and current time is between the scheduled start and end
    if (scheduledStart && scheduledEnd && now >= scheduledStart && now <= scheduledEnd) {
      return {
        status: "nomination",
        label: "Nominations",
        color: "bg-vote-nominations hover:bg-vote-nominations/90"
      };
    }

    // Upcoming if there is no nomination and the start date isn't arrived
    // or there is a nomination but scheduling start isn't arrived
    if ((startedAt && now < startedAt) || (scheduledStart && now < scheduledStart)) {
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-secondary hover:bg-secondary/90"
      };
    }

    return {
      status: "unknown",
      label: "Not Scheduled",
      color: "bg-muted hover:bg-muted/90"
    };
  };

  const handleJoinAsCandidate = async (session: Session) => {
    try {
      // Check if user has already applied
      const hasApplied = await candidateService.hasUserApplied(session._id);
      if (hasApplied) {
        toast.info("You have already applied as a candidate for this session");
        return;
      }
      
      setSelectedSession(session);
      setShowCandidateForm(true);
    } catch (error) {
      console.error("Error checking candidate status:", error);
    }
  };

  const handleNotificationClick = (notification: NotificationPayload) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleSecretPhraseSubmit = async () => {
    if (!secretPhrase.trim()) {
      toast.error("Please enter a secret phrase");
      return;
    }

    setIsSubmittingPhrase(true);
    try {
      const session = await sessionService.getSessionByPhrase(secretPhrase);
      // If successful, add it to public sessions if not already there
      if (session && session._id) {
        if (!publicSessions.some(s => s._id === session._id)) {
          setPublicSessions(prev => [...prev, session]);
          toast.success("Session accessed successfully");
          setShowSecretPhraseDialog(false);
          setSecretPhrase("");
        } else {
          toast.info("You already have access to this session");
        }
      }
    } catch (error) {
      console.error("Failed to access session with phrase:", error);
      toast.error("Invalid secret phrase. Please try again.");
    } finally {
      setIsSubmittingPhrase(false);
    }
  };

  const getLogo = () => {
    if (theme === 'dark') {
      return "/logos/expanded-dark.png";
    }
    return "/logos/expanded.png";
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-background sticky top-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          <div className="relative h-8 w-auto">
            <Image 
              src={getLogo()} 
              alt="Vote System Logo" 
              width={120} 
              height={32} 
              className="object-contain"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notification Button */}
          <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              {notifications.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-100px)]">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-3 rounded-md border ${notification.read ? 'bg-background' : 'bg-muted'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start">
                        <Badge variant={notification.type === 'error' ? 'destructive' : notification.type === 'success' ? 'default' : 'secondary'}>
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{notification.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No notifications for you
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* User Profile */}
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Available Sessions</h1>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button 
              onClick={() => setShowSecretPhraseDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Enter Secret Phrase
            </Button>
            <Button 
              onClick={() => setShowPricingDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="grid place-items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : publicSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicSessions.map((session) => {
              const lifecycleStatus = getSessionLifecycleStatus(session);
              
              return (
                <div key={session._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Banner */}
                  <div className="h-32 bg-gray-200 relative">
                    {session.banner ? (
                      <Image
                        src={session.banner}
                        alt={session.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500">
                        <Flag className="w-12 h-12 text-white opacity-70" />
                      </div>
                    )}
                    
                    {/* Session Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="capitalize">
                        {session.type}
                      </Badge>
                    </div>
                    
                    {/* Lifecycle Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className={`${lifecycleStatus.color} text-primary-foreground`}>
                        {lifecycleStatus.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-2 line-clamp-1">{session.name}</h2>
                    {session.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                    
                    <div className="flex flex-col gap-2 mt-4 text-sm">
                      {/* Organization Name */}
                      {session.organizationName && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{session.organizationName}</span>
                        </div>
                      )}
                      
                      {/* Scheduled Dates */}
                      {session.sessionLifecycle.scheduledAt.start && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(session.sessionLifecycle.scheduledAt.start).toLocaleDateString()}
                            {session.sessionLifecycle.scheduledAt.end && 
                              ` - ${new Date(session.sessionLifecycle.scheduledAt.end).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      
                      {/* Event Duration */}
                      {session.sessionLifecycle.startedAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Started: {new Date(session.sessionLifecycle.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        className={`w-full ${lifecycleStatus.status === "nomination" ? "bg-vote-nominations hover:bg-vote-nominations/90 text-primary-foreground" : ""}`}
                        variant={lifecycleStatus.status === "nomination" ? "default" : "outline"}
                        onClick={() => handleJoinAsCandidate(session)}
                        disabled={lifecycleStatus.status !== "nomination"}
                      >
                        Join as Candidate
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sessions available at this time.</p>
          </div>
        )}
      </main>

      {/* Secret Phrase Dialog */}
      <Dialog open={showSecretPhraseDialog} onOpenChange={setShowSecretPhraseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Secret Phrase</DialogTitle>
            <DialogDescription>
              Enter the secret phrase to access a private session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="secret-phrase">Secret Phrase</Label>
              <Input
                id="secret-phrase"
                value={secretPhrase}
                onChange={(e) => setSecretPhrase(e.target.value)}
                placeholder="Enter the secret phrase"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSecretPhraseDialog(false);
                setSecretPhrase("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSecretPhraseSubmit}
              disabled={isSubmittingPhrase}
            >
              {isSubmittingPhrase ? "Checking..." : "Access Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <PricingDialog 
        open={showPricingDialog} 
        onOpenChange={setShowPricingDialog} 
      />

      {/* Candidate Form Dialog */}
      {selectedSession && (
        <CandidateFormDialog 
          open={showCandidateForm}
          onOpenChange={setShowCandidateForm}
          sessionId={selectedSession._id}
          sessionTitle={selectedSession.name}
        />
      )}
    </div>
  );
}
