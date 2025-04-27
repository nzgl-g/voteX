"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Textarea } from "@/components/shadcn-ui/textarea"
import { Label } from "@/components/shadcn-ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar"
import { Badge } from "@/components/shadcn-ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Bell, CheckCircle2, Clock, Pin, Trash2, Plus } from "lucide-react"
import { format } from "date-fns"
import { Separator } from "@/components/shadcn-ui/separator"

// Mock data for announcements
const announcementsData = [
  {
    id: "1",
    title: "New Election Process",
    content:
      "We're implementing a new election verification process starting next week. Please review the documentation.",
    author: "Alex Johnson",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    timestamp: "2023-06-15T09:30:00",
    isPinned: true,
  },
  {
    id: "2",
    title: "Team Meeting",
    content: "Reminder: Team meeting tomorrow at 10:00 AM to discuss quarterly goals.",
    author: "Sarah Williams",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    timestamp: "2023-06-14T14:20:00",
    isPinned: false,
  },
]

// Mock data for tasks
const tasksData = [
  {
    id: "1",
    title: "Review candidate profile data",
    description: "Validate all candidate information for the upcoming election.",
    assignedTo: ["Alex Johnson", "Sarah Williams"],
    dueDate: "2023-06-20T23:59:59",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "2",
    title: "Update team documentation",
    description: "Add the new validation procedures to the team wiki.",
    assignedTo: ["Michael Brown"],
    dueDate: "2023-06-25T23:59:59",
    status: "not-started",
    priority: "medium",
  },
  {
    id: "3",
    title: "Prepare monthly report",
    description: "Compile statistics and insights for the monthly team report.",
    assignedTo: ["Emily Davis"],
    dueDate: "2023-06-30T23:59:59",
    status: "completed",
    priority: "low",
  },
]

interface AnnouncementsProps {
  sessionId?: string;
}

export default function Announcements({ sessionId }: AnnouncementsProps) {
  const [activeTab, setActiveTab] = useState("announcements")
  const [activeAnnouncementFilter, setActiveAnnouncementFilter] = useState("all")
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("")
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")

  // In a real implementation, you would use sessionId to fetch announcements for this specific session
  // useEffect(() => {
  //   const fetchAnnouncements = async () => {
  //     try {
  //       const response = await apiClient.get(`/sessions/${sessionId}/announcements`)
  //       // Process and set announcements
  //     } catch (error) {
  //       console.error("Error fetching announcements:", error)
  //     }
  //   }
  //   
  //   if (sessionId) {
  //     fetchAnnouncements()
  //   }
  // }, [sessionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating new item:", { title: formTitle, content: formContent })
    setFormTitle("")
    setFormContent("")
    setShowNewForm(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        )
      case "not-started":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Not Started
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
              <Button onClick={() => setShowNewForm(!showNewForm)} size="sm" className="gap-1">
                {showNewForm ? (
                  "Cancel"
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    New {activeTab === "announcements" ? "Announcement" : "Task"}
                  </>
                )}
              </Button>
            </div>

            {showNewForm && (
              <Card className="mb-6 mt-6 border-l-4 border-l-primary shadow-md">
                <CardHeader>
                  <CardTitle>{activeTab === "announcements" ? "Create New Announcement" : "Create New Task"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Enter title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">{activeTab === "announcements" ? "Content" : "Description"}</Label>
                      <Textarea
                        id="content"
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder={activeTab === "announcements" ? "Announcement content..." : "Task description..."}
                        rows={4}
                        required
                      />
                    </div>
                    {activeTab === "tasks" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="assignees">Assignees</Label>
                          <Input id="assignees" placeholder="Select team members" />
                        </div>
                        <div>
                          <Label htmlFor="due-date">Due Date</Label>
                          <Input id="due-date" type="date" />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <select
                            id="priority"
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit">
                        {activeTab === "announcements" ? "Post Announcement" : "Create Task"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <TabsContent value="announcements" className="space-y-4 mt-6">
              {announcementsData.map((announcement) => (
                <Card
                  key={announcement.id}
                  className={`overflow-hidden hover:shadow-md transition-shadow ${
                    announcement.isPinned ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        {announcement.title}
                        {announcement.isPinned && <Pin className="h-4 w-4 ml-2 text-primary" />}
                      </CardTitle>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <time dateTime={announcement.timestamp}>
                          {format(new Date(announcement.timestamp), "MMM d, yyyy")}
                        </time>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{announcement.content}</p>
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex justify-between py-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={announcement.authorAvatar || "/placeholder.svg"} alt={announcement.author} />
                        <AvatarFallback>
                          {announcement.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{announcement.author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Bell className="h-4 w-4 mr-2" />
                      Notify Team
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-6">
              {tasksData.map((task) => (
                <Card
                  key={task.id}
                  className={`overflow-hidden hover:shadow-md transition-shadow ${
                    task.status === "completed" ? "opacity-70" : ""
                  } ${
                    task.priority === "high"
                      ? "border-l-4 border-l-destructive"
                      : task.priority === "medium"
                        ? "border-l-4 border-l-amber-500"
                        : ""
                  }`}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        {task.status === "completed" ? (
                          <span className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            <span className="line-through">{task.title}</span>
                          </span>
                        ) : (
                          task.title
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {task.assignedTo.map((person, index) => (
                          <Avatar key={index} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={person} />
                            <AvatarFallback>
                              {person
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex justify-end py-3">
                    {task.status !== "completed" ? (
                      <Button variant="outline" size="sm" className="h-8">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8">
                        Reopen Task
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
