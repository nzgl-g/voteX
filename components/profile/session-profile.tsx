"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { InfoTab } from "@/components/profile/info-tab"
import { SettingsTab } from "@/components/profile/settings-tab"
import { CandidatesList } from "@/components/profile/candidates-list"
import { SessionActions } from "@/components/profile/session-actions"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "@/lib/types"

interface SessionProfileProps {
  session: Session
}

export function SessionProfile({ session }: SessionProfileProps) {
  const [currentSession, setCurrentSession] = useState<Session>(session)
  const [activeTab, setActiveTab] = useState<string>("info")

  const handleUpdateSession = (updatedData: Partial<Session>) => {
    setCurrentSession((prev) => ({ ...prev, ...updatedData }))
  }

  // Determine session status
  const getSessionStatus = () => {
    const now = new Date()
    const endDate = new Date(currentSession.sessionLifecycle.endedAt)
    const startDate = new Date(currentSession.sessionLifecycle.startedAt)

    if (endDate < now) return "ended"
    if (startDate <= now) return "active"
    return "scheduled"
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
      {/* Banner section */}
      <div className="mb-8 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
        <div className="relative">
          <div
            className="h-48 sm:h-56 md:h-64 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${currentSession.banner || "/placeholder.svg?height=200&width=1200"})` }}
            aria-label="Session banner image"
          />

          {/* Banner upload button - repositioned to bottom right with improved styling */}
          <div className="absolute bottom-4 right-4">
            <label
              htmlFor="banner-upload"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md cursor-pointer transition-all duration-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              title="Change banner image"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Change banner image</span>
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        handleUpdateSession({ banner: event.target.result as string })
                      }
                    }
                    reader.readAsDataURL(e.target.files[0])
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Session header info */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{currentSession.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                <span className="text-slate-500 dark:text-slate-400">ID: {currentSession.id}</span>
                {currentSession.organizationName && (
                  <>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{currentSession.organizationName}</span>
                  </>
                )}
              </div>
            </div>

            <SessionActions
              sessionStatus={getSessionStatus()}
              onAction={(action) => {
                console.log(`Session action: ${action}`)
                if (action === "start") {
                  handleUpdateSession({
                    sessionLifecycle: {
                      ...currentSession.sessionLifecycle,
                      startedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
                    },
                  })
                } else if (action === "stop") {
                  handleUpdateSession({
                    sessionLifecycle: {
                      ...currentSession.sessionLifecycle,
                      endedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
                    },
                  })
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Main content with tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-8 overflow-hidden">
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-slate-100 dark:bg-slate-800/50">
            <TabsTrigger
              value="info"
              className={cn(
                "text-base py-4 rounded-none data-[state=active]:shadow-none border-b-2 border-transparent",
                "data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                "transition-all duration-200",
              )}
            >
              Info
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className={cn(
                "text-base py-4 rounded-none data-[state=active]:shadow-none border-b-2 border-transparent",
                "data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                "transition-all duration-200",
              )}
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-0 m-0">
            <InfoTab session={currentSession} onUpdate={handleUpdateSession} />
          </TabsContent>

          <TabsContent value="settings" className="p-0 m-0">
            <SettingsTab session={currentSession} onUpdate={handleUpdateSession} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Candidates/Options Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">
          {currentSession.type === "poll" ? "Options" : "Candidates"}
        </h2>
        <CandidatesList candidates={currentSession.candidates || []} sessionType={currentSession.type} />
      </div>
    </div>
  )
}
