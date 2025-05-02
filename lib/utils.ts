import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function alertApiError(error: any, defaultMessage: string = "An error occurred") {
  console.error(error)
  
  // Try to extract error message from different possible error shapes
  const errorMessage = 
    error?.response?.data?.message || 
    error?.response?.data?.error || 
    error?.message || 
    defaultMessage
    
  toast.error(errorMessage)
  return errorMessage
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function getSessionStatus(session: { 
  sessionLifecycle: { 
    scheduledAt: { start: string | null; end: string | null };
    startedAt: string | null;
    endedAt: string | null;
  }
}): "nomination" | "active" | "ended" {
  const now = new Date()
  const startDate = session.sessionLifecycle.startedAt 
    ? new Date(session.sessionLifecycle.startedAt) 
    : (session.sessionLifecycle.scheduledAt.start 
      ? new Date(session.sessionLifecycle.scheduledAt.start) 
      : null)
  const endDate = session.sessionLifecycle.endedAt 
    ? new Date(session.sessionLifecycle.endedAt) 
    : (session.sessionLifecycle.scheduledAt.end 
      ? new Date(session.sessionLifecycle.scheduledAt.end) 
      : null)
  
  if (session.sessionLifecycle.endedAt || (endDate && now > endDate)) {
    return "ended"
  } else if (session.sessionLifecycle.startedAt || (startDate && now >= startDate)) {
    return "active"
  } else {
    return "nomination"
  }
}
