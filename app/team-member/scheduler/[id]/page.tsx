"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Calendar } from "@/components/shadcn-ui/calendar"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn-ui/dialog"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Plus, Calendar as CalendarIcon, Clock, Trash } from "lucide-react"
import { ScrollArea } from "@/components/shadcn-ui/scroll-area"
import { Badge } from "@/components/shadcn-ui/badge"
import { toast } from "@/hooks/use-toast"
import { format, isSameDay } from "date-fns"

// Mock event data - replace with API calls in production
const mockEvents = [
  {
    id: "1",
    title: "Team Briefing",
    description: "Weekly team briefing for the upcoming election.",
    date: new Date(2023, 10, 15),
    time: "10:00 AM"
  },
  {
    id: "2",
    title: "Voter Registration Deadline",
    description: "Last day for voters to register for the election.",
    date: new Date(2023, 10, 20),
    time: "11:59 PM"
  },
  {
    id: "3",
    title: "Campaign Event",
    description: "Major campaign event for candidates.",
    date: new Date(2023, 11, 1),
    time: "6:00 PM"
  }
]

export default function TeamMemberSchedulerPage() {
  const params = useParams()
  const sessionId = params.id as string
  
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState(mockEvents)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    time: "",
    date: new Date()
  })
  
  // Get events for the selected date
  const eventsForSelectedDate = events.filter(event => 
    date && event.date ? isSameDay(new Date(event.date), new Date(date)) : false
  )
  
  // Date with events for highlighting on calendar
  const datesWithEvents = events.map(event => new Date(event.date))
  
  // Handle adding a new event
  const handleAddEvent = () => {
    if (!newEvent.title) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      })
      return
    }
    
    const event = {
      id: `event-${Date.now()}`,
      ...newEvent,
      date: date
    }
    
    setEvents([...events, event])
    setIsAddEventOpen(false)
    setNewEvent({
      title: "",
      description: "",
      time: "",
      date: new Date()
    })
    
    toast({
      title: "Event added",
      description: "The event has been added to the calendar."
    })
  }
  
  // Handle deleting an event
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id))
    
    toast({
      title: "Event deleted",
      description: "The event has been removed from the calendar."
    })
  }
  
  return (
    <>
      <SiteHeader title="Event Scheduler" />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                Select a date to view or add events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
                modifiers={{
                  hasEvent: datesWithEvents
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '50%'
                  }
                }}
              />
            </CardContent>
            <CardFooter>
              <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                      Create a new event for {date ? format(date, "MMMM do, yyyy") : "selected date"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input 
                        id="title" 
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        placeholder="Enter event title" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <Input 
                        id="time" 
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        placeholder="e.g. 3:00 PM" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        placeholder="Enter event details" 
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent}>
                      Add Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          
          {/* Events for selected date */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                Events for {date ? format(date, "MMMM do, yyyy") : "selected date"}
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length === 0 
                  ? "No events scheduled for this date" 
                  : `${eventsForSelectedDate.length} event(s) scheduled`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {eventsForSelectedDate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                    <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                    <p>No events scheduled for this date</p>
                    <p className="text-sm mt-1">
                      Click the "Add Event" button to schedule something
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventsForSelectedDate.map((event) => (
                      <Card key={event.id}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{event.title}</CardTitle>
                            <button 
                              className="text-destructive hover:text-red-700"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                          <CardDescription className="flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 