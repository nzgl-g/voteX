"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/sidebar/site-header"
import { ChartBar, BarChart3, PieChart, LineChart, ChartBarIcon, ChevronRight, Activity, TrendingUp } from "lucide-react"

export default function MonitoringPage() {
  return (
    <>
      <SiteHeader title="Monitoring Dashboard" />
      <div className="container mx-auto p-6 min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <Card className="w-full max-w-5xl relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-sky-950/30">
          <div className="absolute inset-0 bg-graph-pattern opacity-5"></div>
          
          <CardContent className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left content column */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <Activity className="h-4 w-4" />
                  <span>Coming Soon</span>
                </div>
                
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Advanced Analytics Dashboard
                </h1>
                
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  We're building a comprehensive monitoring system with powerful visualizations to help you understand your voting data better.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Real-time Results</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Visualize voting data as it happens</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <div className="bg-cyan-100 p-2 rounded-lg text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Detailed Metrics</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Track participation and engagement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <div className="bg-sky-100 p-2 rounded-lg text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Trend Analysis</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Understand patterns and behaviors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <LineChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Historical Data</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Compare with previous sessions</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/team-leader/sessions">
                      View Active Sessions
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
              
              {/* Right graphics column */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative h-96 w-full">
                  {/* Abstract chart elements */}
                  <div className="absolute top-5 left-5 w-3/4 h-32 bg-blue-200/50 dark:bg-blue-800/30 rounded-lg shadow-sm opacity-70 backdrop-blur-sm"></div>
                  <div className="absolute top-12 left-12 w-3/4 h-32 bg-cyan-200/50 dark:bg-cyan-800/30 rounded-lg shadow-sm opacity-70 backdrop-blur-sm"></div>
                  <div className="absolute top-20 left-20 w-3/4 h-32 bg-sky-200/50 dark:bg-sky-800/30 rounded-lg shadow-sm opacity-70 backdrop-blur-sm"></div>
                  
                  {/* Chart Icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 blur-3xl -z-10 scale-150"></div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg">
                        <ChartBar className="h-20 w-20 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Bars */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-end justify-center gap-3 h-32 w-4/5">
                    <div className="w-8 bg-blue-400/80 dark:bg-blue-500/60 rounded-t-md animate-pulse-slow" style={{ height: '55%' }}></div>
                    <div className="w-8 bg-cyan-400/80 dark:bg-cyan-500/60 rounded-t-md animate-pulse-slow" style={{ height: '80%', animationDelay: '0.5s' }}></div>
                    <div className="w-8 bg-sky-400/80 dark:bg-sky-500/60 rounded-t-md animate-pulse-slow" style={{ height: '65%', animationDelay: '1s' }}></div>
                    <div className="w-8 bg-indigo-400/80 dark:bg-indigo-500/60 rounded-t-md animate-pulse-slow" style={{ height: '90%', animationDelay: '1.5s' }}></div>
                    <div className="w-8 bg-blue-400/80 dark:bg-blue-500/60 rounded-t-md animate-pulse-slow" style={{ height: '70%', animationDelay: '2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <style jsx global>{`
          .animate-pulse-slow {
            animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              height: 100%;
            }
            50% {
              opacity: 0.7;
              height: 70%;
            }
          }
          
          .bg-graph-pattern {
            background-image: 
              radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>
      </div>
    </>
  )
} 