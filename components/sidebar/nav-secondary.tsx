import React from "react"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shadcn-ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    badge?: React.ReactNode
    isActive?: boolean
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  
  // Extract session ID from the current path if it exists
  const getSessionIdFromPath = () => {
    const pathSegments = pathname.split('/')
    // Assuming session IDs are MongoDB ObjectIds (24 character hex strings)
    const sessionIdPattern = /^[0-9a-f]{24}$/i
    return pathSegments.find(segment => sessionIdPattern.test(segment)) || 'default'
  }
  
  // Build the correct URL with the session ID
  const buildUrl = (baseUrl: string) => {
    // If the base URL doesn't include team-leader or team-member, return as is
    if (!baseUrl.includes('team-leader') && !baseUrl.includes('team-member')) {
      return baseUrl
    }
    
    // Get the session ID from the current path
    const sessionId = getSessionIdFromPath()
    
    // Handle relative URLs (starting with ./)
    if (baseUrl.startsWith('./')) {
      // Remove the ./ prefix
      const routePath = baseUrl.substring(2)
      
      // Split the route path to separate the route type from 'default'
      const routeParts = routePath.split('/')
      
      // If the route includes 'default', replace it with the session ID
      if (routeParts.length > 1 && routeParts[1] === 'default') {
        return `/${routeParts[0]}/${sessionId}`
      }
      
      // Return the full path with session ID
      return `/team-leader/${routePath.replace('default', sessionId)}`
    }
    
    // For absolute URLs, extract the base route and append the session ID
    const urlParts = baseUrl.split('/')
    const routeType = urlParts[urlParts.length - 2] // e.g., 'monitoring', 'session'
    
    // Construct the proper URL format
    return `/team-leader/${routeType}/${sessionId}`
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={buildUrl(item.url)}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
