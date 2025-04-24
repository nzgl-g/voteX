"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import type { Candidate } from "@/lib/types"
import { generateCandidateVotesOverTime } from "@/lib/mock"

interface CandidatesListProps {
  candidates: Candidate[]
  timeRange: "day" | "week" | "month"
}

export function CandidatesList({ candidates, timeRange }: CandidatesListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Party</TableHead>
          <TableHead className="w-[300px]">Votes Over Time</TableHead>
          <TableHead className="text-right">Total Votes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => {
          // Generate mock data for the mini chart
          const chartData = generateCandidateVotesOverTime(candidate.id, timeRange)

          return (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">{candidate.fullName}</TableCell>
              <TableCell>{candidate.partyName}</TableCell>
              <TableCell>
                <div className="h-[60px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Area
                        type="monotone"
                        dataKey="votes"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={1.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">{candidate.totalVotes.toLocaleString()}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
