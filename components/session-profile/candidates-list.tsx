"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Card, CardContent } from "@/components/shadcn-ui/card"
import { Badge } from "@/components/shadcn-ui/badge"
import { Avatar, AvatarFallback } from "@/components/shadcn-ui/avatar"
import { Input } from "@/components/shadcn-ui/input"
import { PlusIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Candidate } from "@/lib/types"

interface CandidatesListProps {
  candidates: Candidate[]
  sessionType: "poll" | "election" | "tournament"
}

export function CandidatesList({ candidates, sessionType }: CandidatesListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.partyName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
      case "Pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40"
      case "Refused":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/40"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder={`Search ${sessionType === "poll" ? "options" : "candidates"}...`}
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2 whitespace-nowrap">
          <PlusIcon className="h-4 w-4" />
          Add {sessionType === "poll" ? "Option" : "Candidate"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <Card
              key={candidate.id}
              className="overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getInitials(candidate.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{candidate.fullName}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{candidate.partyName}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Badge className={cn("font-normal", getStatusColor(candidate.status))}>{candidate.status}</Badge>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {candidate.totalVotes.toLocaleString()} votes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            No {sessionType === "poll" ? "options" : "candidates"} found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
