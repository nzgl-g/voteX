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
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  userRole = 'team-leader',
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    badge?: React.ReactNode
    isActive?: boolean
  }[]
  userRole?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  
  // Extract session ID from the current path if it exists
  const getSessionIdFromPath = () => {
    const pathSegments = pathname.split('/')
    // Assuming session IDs are MongoDB ObjectIds (24 character hex strings)
    const sessionIdPattern = /^[0-9a-f]{24}$/i
    return pathSegments.find(segment => sessionIdPattern.test(segment)) || 'default'
  }
  
  // Get the user's role from the path or use the provided userRole
  const getUserRole = () => {
    if (pathname.includes('team-leader')) return 'team-leader'
    if (pathname.includes('team-member')) return 'team-member'
    return userRole
  }
  
  // Build the correct URL with the session ID and user role
  const buildUrl = (baseUrl: string) => {
    // If the base URL is an absolute URL (not starting with / or ./) or a hash link, return as is
    if (baseUrl.startsWith('http') || baseUrl === '#') {
      return baseUrl
    }
    
    // Get the user role
    const role = getUserRole()
    
    // Get the session ID from the current path
    const sessionId = getSessionIdFromPath()
    
    // If the URL already includes the role path, use it as is with the session ID
    if (baseUrl.includes(`/${role}/`)) {
      // Replace 'default' with the session ID if needed
      return baseUrl.replace('default', sessionId)
    }
    
    // Handle relative URLs (starting with ./)
    if (baseUrl.startsWith('./')) {
      // Remove the ./ prefix
      const routePath = baseUrl.substring(2)
      
      // Split the route path to get the route type
      const routeType = routePath.split('/')[0]
      
      // Return the proper path with role and session ID
      return `/${role}/${routeType}/${sessionId}`
    }
    
    // For URLs with /team-leader/ or /team-member/ but not matching the current role
    if (baseUrl.includes('/team-leader/') || baseUrl.includes('/team-member/')) {
      // Extract route segments
      const segments = baseUrl.split('/')
      const routeIndex = segments.findIndex(seg => seg === 'team-leader' || seg === 'team-member')
      
      if (routeIndex >= 0) {
        // Replace the role segment
        segments[routeIndex] = role
        
        // Replace 'default' with the sessionId if it exists
        const defaultIndex = segments.indexOf('default')
        if (defaultIndex >= 0) {
          segments[defaultIndex] = sessionId
        }
        
        return segments.join('/')
      }
    }
    
    // For simple route types with no role or session
    return baseUrl
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
