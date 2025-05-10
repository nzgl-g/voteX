"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeBuoy } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LifeBuoy className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Coming Soon</CardTitle>
          <CardDescription className="text-lg">
            Our support system is currently under development. We're working hard to bring you the best experience possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Please check back later for updates.</p>
        </CardContent>
      </Card>
    </div>
  )
}
