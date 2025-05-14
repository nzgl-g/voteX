"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { LifeBuoy, Mail, Clock, Calendar, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SupportPage() {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({
    email: false,
    launch: false
  })

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied({...copied, [key]: true})
    setTimeout(() => setCopied({...copied, [key]: false}), 2000)
  }

  return (
    <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-4xl relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        
        <CardContent className="p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <span className="select-text">Coming Soon</span>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 select-text">
                Support Center
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 select-text">
                We're building a comprehensive support system to assist you with any questions or issues you might encounter.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3 group hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium select-text">Launch Date</h3>
                    <div className="flex justify-between items-center">
                      <p className="text-slate-500 dark:text-slate-400 select-text" id="launch-date">Coming in Q2 2024</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard("Coming in Q2 2024", "launch")}
                            >
                              {copied.launch ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copied.launch ? "Copied!" : "Copy to clipboard"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 group hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
                  <div className="bg-purple-100 p-2 rounded-full text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium select-text">Contact Us</h3>
                    <div className="flex justify-between items-center">
                      <a 
                        href="mailto:support@votesystem.com" 
                        className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors select-text underline"
                      >
                        support@votesystem.com
                      </a>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard("support@votesystem.com", "email")}
                            >
                              {copied.email ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copied.email ? "Copied!" : "Copy to clipboard"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="mt-4" variant="default">
                Contact Support Team
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="relative w-72 h-72 cursor-pointer" role="img" aria-label="Support icon" tabIndex={0}>
                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 blur-3xl -z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <LifeBuoy className="h-32 w-32 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute top-0 left-0 w-full h-full border-8 border-dashed border-blue-200 dark:border-blue-800/50 rounded-full animate-spin-slow"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .select-text {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }
      `}</style>
    </div>
  )
}
