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
  // Define chart colors using global CSS variables
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ]

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
        {candidates.map((candidate, index) => {
          // Generate mock data for the mini chart
          const chartData = generateCandidateVotesOverTime(candidate.id, timeRange)
          // Get color for this candidate
          const chartColor = chartColors[index % chartColors.length]

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
                      <defs>
                        <linearGradient id={`colorGradient-${candidate.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="votes"
                        stroke={chartColor}
                        fill={`url(#colorGradient-${candidate.id})`}
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
