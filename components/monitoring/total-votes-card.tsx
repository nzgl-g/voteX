"use client"

import { VoteIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TotalVotesCardProps {
  totalVotes: number
}

export function TotalVotesCard({ totalVotes }: TotalVotesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <VoteIcon className="h-4 w-4" />
          Total Votes
        </CardTitle>
        <CardDescription>Cumulative votes across all candidates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold">{totalVotes.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
