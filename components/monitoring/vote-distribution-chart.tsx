"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { Candidate } from "@/lib/types"

interface VoteDistributionChartProps {
  candidates: Candidate[]
}

export function VoteDistributionChart({ candidates }: VoteDistributionChartProps) {
  // Transform candidates data for pie chart
  const data = candidates.map((candidate) => ({
    name: candidate.fullName,
    value: candidate.totalVotes,
    id: candidate.id,
    party: candidate.partyName,
  }))

  // Calculate total votes for percentage
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.totalVotes, 0)

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = Math.round((data.value / totalVotes) * 100)

      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.party}</p>
          <div className="flex justify-between gap-4 mt-1">
            <span className="text-sm">{data.value.toLocaleString()} votes</span>
            <span className="text-sm font-medium">{percentage}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Define chart colors using global CSS variables
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ]

  return (
    <div className="w-full h-[300px] flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]} 
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Total votes in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold">{totalVotes.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">Total Votes</span>
      </div>
    </div>
  )
}
