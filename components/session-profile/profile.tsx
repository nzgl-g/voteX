"use client"

import { useState, useEffect } from "react"
import { Session } from "@/services/session-service"
import { format } from "date-fns"
import { Calendar, Clock, CheckCircle2, Ban, Award, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProfileProps {
  session: Session
  onUpdate: (session: Session) => void
}

export default function Profile({ session, onUpdate }: ProfileProps) {
  const [currentSession, setCurrentSession] = useState<Session>(session)
  
  useEffect(() => {
    setCurrentSession(session)
  }, [session])

  // Format date in a consistent, readable format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy • h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get session status
  const getSessionStatus = (): { status: string; label: string; color: string } => {
    const now = new Date();
    const scheduledStart = currentSession.sessionLifecycle?.scheduledAt?.start
      ? new Date(currentSession.sessionLifecycle.scheduledAt.start)
      : null;
    const scheduledEnd = currentSession.sessionLifecycle?.scheduledAt?.end
      ? new Date(currentSession.sessionLifecycle.scheduledAt.end)
      : null;
    const startedAt = currentSession.sessionLifecycle?.startedAt
      ? new Date(currentSession.sessionLifecycle.startedAt)
      : null;
    const endedAt = currentSession.sessionLifecycle?.endedAt
      ? new Date(currentSession.sessionLifecycle.endedAt)
      : null;

    // Check if session has ended
    if (endedAt && now > endedAt) {
      return {
        status: "ended",
        label: "Ended",
        color: "bg-zinc-700 hover:bg-zinc-800 text-white",
      };
    }

    // Check if session has a contract address (indicates it's deployed)
    if (currentSession.contractAddress) {
      return {
        status: "active",
        label: "Active",
        color: "bg-emerald-600 hover:bg-emerald-700 text-white",
      };
    }

    // Check if session has started
    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return {
        status: "pending_deployment",
        label: "Pending Deployment",
        color: "bg-amber-500 hover:bg-amber-600 text-black",
      };
    }

    // Check for nomination phase (for election type)
    if (currentSession.type === "election" && scheduledStart && scheduledEnd) {
      if (now >= scheduledStart && now <= scheduledEnd) {
        return {
          status: "nomination",
          label: "Nominations Open",
          color: "bg-indigo-500 hover:bg-indigo-600 text-white",
        };
      }
    }

    // Default to coming soon
    return {
      status: "upcoming",
      label: "Coming Soon",
      color: "bg-blue-500 hover:bg-blue-600 text-white",
    };
  };

  const statusInfo = getSessionStatus();

  // Timeline event component
  const TimelineEvent = ({ 
    icon, 
    title, 
    date, 
    isActive = false,
    isPast = false,
    isFuture = false
  }: { 
    icon: React.ReactNode, 
    title: string, 
    date: string,
    isActive?: boolean,
    isPast?: boolean,
    isFuture?: boolean
  }) => (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg transition-all",
      isActive ? "bg-primary/10 border-l-4 border-primary" : 
      isPast ? "opacity-80" :
      isFuture ? "opacity-60" : ""
    )}>
      <div className={cn(
        "p-2 rounded-full",
        isActive ? "bg-primary/20 text-primary" : 
        isPast ? "bg-muted text-muted-foreground" :
        isFuture ? "bg-muted/50 text-muted-foreground/70" : "bg-muted"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          isActive ? "text-primary" : 
          isPast ? "text-foreground" :
          isFuture ? "text-muted-foreground" : "text-foreground"
        )}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{date}</p>
      </div>
    </div>
  );

  return (
    <div className="py-6">
      <div className="mb-4">
        <Badge className={statusInfo.color}>
          {statusInfo.label}
        </Badge>
      </div>

      <h3 className="text-base font-medium mb-4">Session Timeline</h3>

      <div className="space-y-2 max-w-md">
        {/* Created */}
        <TimelineEvent
          icon={<Calendar className="h-4 w-4" />}
          title="Session Created"
          date={formatDate(currentSession.sessionLifecycle?.createdAt)}
          isPast={true}
        />

        {/* Nomination phase for election type */}
        {currentSession.type === "election" && currentSession.sessionLifecycle?.scheduledAt?.start && (
          <>
            <TimelineEvent
              icon={<Users className="h-4 w-4" />}
              title="Nomination Start"
              date={formatDate(currentSession.sessionLifecycle.scheduledAt.start)}
              isActive={statusInfo.status === "nomination"}
              isPast={new Date() > new Date(currentSession.sessionLifecycle.scheduledAt.start)}
              isFuture={new Date() < new Date(currentSession.sessionLifecycle.scheduledAt.start)}
            />
            <TimelineEvent
              icon={<Award className="h-4 w-4" />}
              title="Nomination End"
              date={formatDate(currentSession.sessionLifecycle.scheduledAt.end)}
              isPast={!!currentSession.sessionLifecycle.scheduledAt.end && 
                new Date() > new Date(currentSession.sessionLifecycle.scheduledAt.end)}
              isFuture={!!currentSession.sessionLifecycle.scheduledAt.end && 
                new Date() < new Date(currentSession.sessionLifecycle.scheduledAt.end)}
            />
          </>
        )}

        {/* Scheduled times for polls */}
        {currentSession.type === "poll" && (
          <>
            {currentSession.sessionLifecycle?.scheduledAt?.start && (
              <TimelineEvent
                icon={<Calendar className="h-4 w-4" />}
                title="Scheduled Start"
                date={formatDate(currentSession.sessionLifecycle.scheduledAt.start)}
                isFuture={!currentSession.sessionLifecycle.startedAt && 
                  new Date() < new Date(currentSession.sessionLifecycle.scheduledAt.start)}
              />
            )}

            {currentSession.sessionLifecycle?.scheduledAt?.end && (
              <TimelineEvent
                icon={<Calendar className="h-4 w-4" />}
                title="Scheduled End"
                date={formatDate(currentSession.sessionLifecycle.scheduledAt.end)}
                isFuture={!currentSession.sessionLifecycle.endedAt && 
                  new Date() < new Date(currentSession.sessionLifecycle.scheduledAt.end)}
              />
            )}
          </>
        )}

        {/* Actual voting start */}
        {currentSession.sessionLifecycle?.startedAt ? (
          <TimelineEvent
            icon={<Clock className="h-4 w-4" />}
            title="Voting Started"
            date={formatDate(currentSession.sessionLifecycle.startedAt)}
            isActive={!currentSession.sessionLifecycle.endedAt && statusInfo.status === "active"}
            isPast={!!currentSession.sessionLifecycle.endedAt}
          />
        ) : (
          <TimelineEvent
            icon={<Clock className="h-4 w-4" />}
            title="Voting Start"
            date="Not started yet"
            isFuture={true}
          />
        )}

        {/* Actual voting end */}
        {currentSession.sessionLifecycle?.endedAt ? (
          <TimelineEvent
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Voting Ended"
            date={formatDate(currentSession.sessionLifecycle.endedAt)}
            isPast={true}
          />
        ) : (
          <TimelineEvent
            icon={<Ban className="h-4 w-4" />}
            title="Voting End"
            date="Not ended yet"
            isFuture={true}
          />
        )}

        {/* Blockchain deployment status */}
        {currentSession.contractAddress ? (
          <TimelineEvent
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Blockchain Deployed"
            date={`Contract: ${currentSession.contractAddress.substring(0, 6)}...${currentSession.contractAddress.substring(currentSession.contractAddress.length - 4)}`}
            isActive={statusInfo.status === "active"}
          />
        ) : statusInfo.status !== "upcoming" && (
          <TimelineEvent
            icon={<Ban className="h-4 w-4" />}
            title="Blockchain Deployment"
            date="Not deployed yet"
            isFuture={true}
          />
        )}
      </div>
    </div>
  )
}
