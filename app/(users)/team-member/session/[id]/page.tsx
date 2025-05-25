"use client"

import { useParams } from "next/navigation"
import { SiteHeader } from "@/components/sidebar/site-header"
import { SessionDetail } from "@/components/session-detail"
import { useEffect, useRef } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

// Role-based wrapper around SessionDetail that restricts functionality for team members
const TeamMemberSessionDetail = ({ sessionId }: { sessionId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use effect to hide buttons and set default tab to settings
  useEffect(() => {
    if (!containerRef.current) return

    const hideActionButtons = () => {
      const buttons = containerRef.current!.querySelectorAll('button')
      
      // Hide start, end, and delete buttons based on text content
      buttons.forEach(button => {
        const buttonText = button.textContent?.trim().toLowerCase() || ''
        if (
          buttonText.includes('start session') || 
          buttonText.includes('deploy contract') || 
          buttonText.includes('end session') || 
          buttonText.includes('delete session')
        ) {
          button.style.display = 'none'
        }
      })
    }
    
    // Set default tab to settings
    const selectSettingsTab = () => {
      const settingsTab = containerRef.current!.querySelector('button[value="settings"]') as HTMLButtonElement
      if (settingsTab && !settingsTab.classList.contains('data-[state=active]')) {
        settingsTab.click()
      }
    }

    // Initial setup
    hideActionButtons()
    
    // Set a short timeout to ensure the tabs are fully rendered before selection
    setTimeout(selectSettingsTab, 200)

    // Create a mutation observer to handle dynamically added buttons
    const observer = new MutationObserver(() => {
      hideActionButtons()
    })

    // Start observing the container for changes
    observer.observe(containerRef.current, { 
      childList: true, 
      subtree: true 
    })

    // Clean up observer on unmount
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-4">
      <Alert variant="default" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/50">
        <Info className="h-4 w-4" />
        <AlertTitle>Team Member Access</AlertTitle>
        <AlertDescription>
          As a team member, you can only view session details and edit the Configuration settings.
          Starting, ending, or deleting sessions requires team leader access.
        </AlertDescription>
      </Alert>
      
      <div ref={containerRef} className="relative">
        <SessionDetail sessionId={sessionId} />
      </div>
    </div>
  )
}

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <>
      <SiteHeader title="Session Management" />
      <main className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <TeamMemberSessionDetail sessionId={sessionId} />
        </div>
      </main>
    </>
  )
}
