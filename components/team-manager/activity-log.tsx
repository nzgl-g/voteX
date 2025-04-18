"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { Badge } from "@/components/shadcn-ui/badge"
import { Calendar } from "@/components/shadcn-ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn-ui/popover"
import { CalendarIcon, Download, Search, RefreshCw } from "lucide-react"
import { format } from "date-fns"

// Mock data for activity log
const activityData = [
  {
    id: "1",
    user: "Alex Johnson",
    action: "Created Election #203",
    timestamp: "2023-06-15T09:30:00",
    type: "create",
  },
  {
    id: "2",
    user: "Sarah Williams",
    action: "Validated candidate profile",
    timestamp: "2023-06-15T10:45:00",
    type: "validate",
  },
  {
    id: "3",
    user: "Michael Brown",
    action: "Updated team permissions",
    timestamp: "2023-06-14T14:20:00",
    type: "update",
  },
  {
    id: "4",
    user: "Emily Davis",
    action: "Exported election results",
    timestamp: "2023-06-14T16:05:00",
    type: "export",
  },
  {
    id: "5",
    user: "David Wilson",
    action: "Added new team member",
    timestamp: "2023-06-13T11:15:00",
    type: "create",
  },
  {
    id: "6",
    user: "Alex Johnson",
    action: "Modified election settings",
    timestamp: "2023-06-13T13:40:00",
    type: "update",
  },
  {
    id: "7",
    user: "Sarah Williams",
    action: "Deleted draft election",
    timestamp: "2023-06-12T09:10:00",
    type: "delete",
  },
  {
    id: "8",
    user: "Michael Brown",
    action: "Sent team notification",
    timestamp: "2023-06-12T15:30:00",
    type: "notification",
  },
]

export default function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [dateFilter, setDateFilter] = useState(null)

  // Get unique users for filter
  const users = [...new Set(activityData.map((item) => item.user))]

  // Get unique action types for filter
  const actionTypes = [...new Set(activityData.map((item) => item.type))]

  // Filter data based on search and filters
  const filteredData = activityData.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUser = userFilter === "" || userFilter === "all_users" || item.user === userFilter

    const matchesAction = actionFilter === "" || actionFilter === "all_actions" || item.type === actionFilter

    const matchesDate =
      !dateFilter || format(new Date(item.timestamp), "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd")

    return matchesSearch && matchesUser && matchesAction && matchesDate
  })

  const getActionBadgeVariant = (type) => {
    switch (type) {
      case "create":
        return "default"
      case "update":
        return "outline"
      case "delete":
        return "destructive"
      case "validate":
        return "success"
      case "export":
        return "secondary"
      case "notification":
        return "warning"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_users">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_actions">All Actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[150px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "MMM d") : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchTerm("")
              setUserFilter("")
              setActionFilter("")
              setDateFilter(null)
            }}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.user}</TableCell>
                  <TableCell>{item.action}</TableCell>
                  <TableCell>{format(new Date(item.timestamp), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(item.type)}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No activities found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>
    </div>
  )
}
