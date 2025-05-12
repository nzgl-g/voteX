"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays, setHours, setMinutes, getDay, format, parseISO } from "date-fns";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { baseApi } from "@/services";

import {
  EventCalendar,
  type CalendarEvent,
  type EventColor,
} from "@/components/event-calendar/index";

// Etiquettes data for calendar filtering
export const etiquettes = [
  {
    id: "my-events",
    name: "My Events",
    color: "emerald" as EventColor,
    isActive: true,
  },
  {
    id: "session-lifecycle",
    name: "Session Lifecycle",
    color: "blue" as EventColor,
    isActive: true,
  },
  {
    id: "nomination-phase",
    name: "Nomination Phase",
    color: "violet" as EventColor,
    isActive: true,
  },
  {
    id: "voting-phase",
    name: "Voting Phase",
    color: "rose" as EventColor,
    isActive: true,
  },
  {
    id: "marketing-team",
    name: "Marketing Team",
    color: "orange" as EventColor,
    isActive: true,
  },
  {
    id: "interviews",
    name: "Interviews",
    color: "violet" as EventColor,
    isActive: true,
  },
  {
    id: "events-planning",
    name: "Events Planning",
    color: "blue" as EventColor,
    isActive: true,
  },
  {
    id: "holidays",
    name: "Holidays",
    color: "rose" as EventColor,
    isActive: true,
  },
];


// Function to calculate days until next Sunday
const getDaysUntilNextSunday = (date: Date) => {
  const day = getDay(date); // 0 is Sunday, 6 is Saturday
  return day === 0 ? 0 : 7 - day; // If today is Sunday, return 0, otherwise calculate days until Sunday
};

// Store the current date to avoid repeated new Date() calls
const currentDate = new Date();

// Calculate the offset once to avoid repeated calculations
const daysUntilNextSunday = getDaysUntilNextSunday(currentDate);

// Sample events data with hardcoded times
const votingSystemEvents: CalendarEvent[] = [];


interface BigCalendarProps {
  sessionId?: string;
}

export default function Component({ sessionId }: BigCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(votingSystemEvents);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Fetch session data
  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      baseApi.get(`/sessions/${sessionId}`)
        .then(response => {
          setSession(response.data);
          generateSessionLifecycleEvents(response.data);
        })
        .catch(error => {
          console.error("Error fetching session:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [sessionId]);

  // Generate lifecycle events based on session data
  const generateSessionLifecycleEvents = (sessionData: any) => {
    if (!sessionData) return;

    const lifecycleEvents: CalendarEvent[] = [];
    const lifecycle = sessionData.sessionLifecycle;

    // Session Creation Event
    if (lifecycle.createdAt) {
      const creationDate = new Date(lifecycle.createdAt);
      lifecycleEvents.push({
        id: 'session-creation',
        title: 'Session Created',
        description: `Session "${sessionData.name}" was created`,
        start: creationDate,
        end: new Date(creationDate.getTime() + 30 * 60000), // 30 minutes duration
        color: 'blue',
        allDay: false,
        etiquette: 'session-lifecycle'
      });
    }

    // Nomination phase events
    if (lifecycle.scheduledAt?.start) {
      const nominationStart = new Date(lifecycle.scheduledAt.start);
      lifecycleEvents.push({
        id: 'nomination-start',
        title: 'Nomination Starts',
        description: `Nomination phase begins for "${sessionData.name}"`,
        start: nominationStart,
        end: new Date(nominationStart.getTime() + 60 * 60000), // 1 hour duration
        color: 'violet',
        allDay: false,
        etiquette: 'nomination-phase'
      });
    }

    if (lifecycle.scheduledAt?.end) {
      const nominationEnd = new Date(lifecycle.scheduledAt.end);
      lifecycleEvents.push({
        id: 'nomination-end',
        title: 'Nomination Ends',
        description: `Nomination phase ends for "${sessionData.name}"`,
        start: nominationEnd,
        end: new Date(nominationEnd.getTime() + 60 * 60000), // 1 hour duration
        color: 'violet',
        allDay: false,
        etiquette: 'nomination-phase'
      });
    }

    // Voting phase events
    if (lifecycle.startedAt) {
      const voteStart = new Date(lifecycle.startedAt);
      lifecycleEvents.push({
        id: 'vote-start',
        title: 'Voting Starts',
        description: `Voting phase begins for "${sessionData.name}"`,
        start: voteStart,
        end: new Date(voteStart.getTime() + 60 * 60000), // 1 hour duration
        color: 'rose',
        allDay: false,
        etiquette: 'voting-phase'
      });
    }

    if (lifecycle.endedAt) {
      const voteEnd = new Date(lifecycle.endedAt);
      lifecycleEvents.push({
        id: 'vote-end',
        title: 'Voting Ends',
        description: `Voting phase ends for "${sessionData.name}"`,
        start: voteEnd,
        end: new Date(voteEnd.getTime() + 60 * 60000), // 1 hour duration
        color: 'rose',
        allDay: false,
        etiquette: 'voting-phase'
      });
    }

    setEvents(prevEvents => {
      // Filter out any previous lifecycle events
      const nonLifecycleEvents = prevEvents.filter(event => 
        !['session-lifecycle', 'nomination-phase', 'voting-phase'].includes(event.etiquette || ''));
      
      // Add the new lifecycle events
      return [...nonLifecycleEvents, ...lifecycleEvents];
    });
  };

  const { isColorVisible } = useCalendarContext();

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <EventCalendar
      events={visibleEvents}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      initialView="week"
    />
  );
}
