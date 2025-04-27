"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface VotesOverTimeChartProps {
  data: Array<{ time: string; votes: number }>
  timeRange: "day" | "week" | "month"
}

export function VotesOverTimeChart({ data, timeRange }: VotesOverTimeChartProps) {
  // Format tooltip time based on time range
  const formatTooltipTime = (time: string) => {
    const date = new Date(time)
    if (timeRange === "day") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Get appropriate x-axis label based on time range
  const getXAxisLabel = () => {
    switch (timeRange) {
      case "day":
        return "24-hour period"
      case "week":
        return "Last 7 days"
      case "month":
        return "Last 30 days"
      default:
        return "Time period"
    }
  }

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={false} // Hide the ticks
            label={{ 
              value: getXAxisLabel(), 
              position: "insideBottom", 
              offset: -5,
              className: "fill-muted-foreground text-xs"
            }}
            className="text-muted-foreground"
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`} 
            dx={-10}
            className="text-muted-foreground text-xs" 
          />
          <Tooltip
            formatter={(value) => [`${value} votes`, "Votes"]}
            labelFormatter={formatTooltipTime}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="votes"
            stroke="hsl(var(--chart-1))"
            fill="url(#colorVotes)"
            strokeWidth={2}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
