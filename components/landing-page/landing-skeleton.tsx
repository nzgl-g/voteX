"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function LandingSkeleton() {
  return (
    <div className="space-y-10 p-4">
      {/* Navbar skeleton */}
      <div className="flex justify-between items-center p-2 rounded-2xl border">
        <Skeleton className="h-10 w-32" />
        <div className="hidden md:flex space-x-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Hero section skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-12">
        <div className="space-y-6 w-full md:w-1/2">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
          <div className="flex space-x-4 pt-4">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
        <Skeleton className="h-80 w-full md:w-1/2 rounded-lg" />
      </div>
      
      {/* Features section skeleton */}
      <div className="py-12">
        <Skeleton className="h-10 w-60 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
