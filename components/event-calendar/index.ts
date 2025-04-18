"use client";

// Component exports
export { AgendaView } from "./views/agenda-view";
export { DayView } from "./views/day-view";
export { DraggableEvent } from "./draggable-event";
export { DroppableCell } from "./droppable-cell";
export { EventDialog } from "./event-dialog";
export { EventItem } from "./event-item";
export { EventsPopup } from "./events-popup";
export { EventCalendar } from "./event-calendar";
export { MonthView } from "./views/month-view";
export { WeekView } from "./views/week-view";
export { CalendarDndProvider, useCalendarDnd } from "./calendar-dnd-context";

// Constants and utility exports
export * from "./constants";
export * from "./utils";

// Hook exports
export * from "@/hooks/use-current-time-indicator";
export * from "@/hooks/use-event-visibility";

// Type exports
export type { CalendarEvent, CalendarView, EventColor } from "@/lib/types";
