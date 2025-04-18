import * as React from "react"

import { DatePicker } from "@/components/sidebar/date-picker"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,

} from "@/components/shadcn-ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "younes",
    email: "younes@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  }
}

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
      </SidebarContent>
    </Sidebar>
  )
}
