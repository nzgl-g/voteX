"use client"

import { useState } from "react"
import { Activity, Download, Link, RefreshCw, Search, SlidersHorizontal, Timer, Vote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChartTooltip } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const votesOverTime = [
    { time: "09:00", votes: 120 },
    { time: "10:00", votes: 240 },
    { time: "11:00", votes: 380 },
    { time: "12:00", votes: 450 },
    { time: "13:00", votes: 520 },
    { time: "14:00", votes: 590 },
    { time: "15:00", votes: 620 },
    { time: "16:00", votes: 700 },
]

const sparklineData = [
    { time: "1", votes: 20 },
    { time: "2", votes: 40 },
    { time: "3", votes: 30 },
    { time: "4", votes: 70 },
    { time: "5", votes: 50 },
    { time: "6", votes: 90 },
    { time: "7", votes: 100 },
]

const candidateData = [
    { id: 1, name: "Candidate A", votes: 2450, percentage: 42.3, color: "#4f46e5" },
    { id: 2, name: "Candidate B", votes: 1830, percentage: 31.6, color: "#06b6d4" },
    { id: 3, name: "Candidate C", votes: 950, percentage: 16.4, color: "#ec4899" },
    { id: 4, name: "Candidate D", votes: 560, percentage: 9.7, color: "#f59e0b" },
]

const blockchainTransactions = [
    {
        hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
        action: "Cast Vote",
        time: "09:12:34",
        gas: "0.0023 ETH",
        block: 14532678,
        type: "vote",
    },
    {
        hash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a",
        action: "Cast Vote",
        time: "09:15:22",
        gas: "0.0021 ETH",
        block: 14532679,
        type: "vote",
    },
    {
        hash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b",
        action: "Cast Vote",
        time: "09:18:45",
        gas: "0.0025 ETH",
        block: 14532680,
        type: "vote",
    },
    {
        hash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c",
        action: "Session Update",
        time: "09:20:00",
        gas: "0.0035 ETH",
        block: 14532681,
        type: "session",
    },
    {
        hash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d",
        action: "Cast Vote",
        time: "09:22:11",
        gas: "0.0022 ETH",
        block: 14532682,
        type: "vote",
    },
    {
        hash: "0x6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e",
        action: "Session Update",
        time: "09:30:00",
        gas: "0.0032 ETH",
        block: 14532683,
        type: "session",
    },
    {
        hash: "0x7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f",
        action: "Cast Vote",
        time: "09:32:45",
        gas: "0.0024 ETH",
        block: 14532684,
        type: "vote",
    },
    {
        hash: "0x8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f7g",
        action: "Cast Vote",
        time: "09:35:12",
        gas: "0.0023 ETH",
        block: 14532685,
        type: "vote",
    },
    {
        hash: "0x9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f7g8h",
        action: "System Check",
        time: "09:40:00",
        gas: "0.0040 ETH",
        block: 14532686,
        type: "system",
    },
    {
        hash: "0x0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f7g8h9i",
        action: "Cast Vote",
        time: "09:42:33",
        gas: "0.0022 ETH",
        block: 14532687,
        type: "vote",
    },
]

// Countdown timer function
function useCountdown() {
    const [timeRemaining, setTimeRemaining] = useState("02:45:30")

    // In a real app, you would implement actual countdown logic here
    return timeRemaining
}

export default function AnalystDashboard() {
    const timeRemaining = useCountdown()
    const [txFilter, setTxFilter] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Filter transactions based on type and search term
    const filteredTransactions = blockchainTransactions.filter((tx) => {
        const matchesFilter = txFilter === "all" || tx.type === txFilter
        const matchesSearch =
            searchTerm === "" ||
            tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.action.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesFilter && matchesSearch
    })

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                    <h1 className="text-xl font-semibold">Voting Analytics Dashboard</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Refresh</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>Filters</span>
                        </Button>
                    </div>
                </header>
                <main className="flex-1 grid gap-4 p-4 md:gap-8 md:p-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
                                <Vote className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">5,790</div>
                                <div className="h-[80px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={sparklineData}>
                                            <Line type="monotone" dataKey="votes" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Session Status</CardTitle>
                                <Activity className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                    Active
                  </span>
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-2">Session ID: #VT-2023-06-15</p>
                                <p className="text-xs text-green-700 dark:text-green-400">Started: 09:00:00 AM</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
                                <Timer className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{timeRemaining}</div>
                                <div className="mt-2 h-2 w-full rounded-full bg-amber-200 dark:bg-amber-800">
                                    <div className="h-2 w-[35%] rounded-full bg-amber-500"></div>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">Ends at: 18:00:00 PM</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Blockchain Transactions</CardTitle>
                                <Link className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">127</div>
                                <p className="text-xs text-purple-700 dark:text-purple-400 mt-2">Network: Ethereum Testnet</p>
                                <p className="text-xs text-purple-700 dark:text-purple-400">Contract: 0x1a2b...3c4d</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-7">
                            <CardHeader>
                                <CardTitle className="text-blue-600 dark:text-blue-400">Votes Over Time</CardTitle>
                                <CardDescription>Vote count per hour during the current session</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full" style={{ height: "250px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={votesOverTime}>
                                            <defs>
                                                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Area type="monotone" dataKey="votes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVotes)" />
                                            <ChartTooltip
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "6px",
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-pink-600 dark:text-pink-400">Candidates & Vote Counts</CardTitle>
                                <CardDescription>Current standings by candidate</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {candidateData.map((candidate) => (
                                        <div key={candidate.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">
                                                        {candidate.id}. {candidate.name}
                                                    </div>
                                                </div>
                                                <div className="font-medium">
                                                    {candidate.votes} ({candidate.percentage}%)
                                                </div>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{ width: `${candidate.percentage}%`, backgroundColor: candidate.color }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle className="text-purple-600 dark:text-purple-400">Blockchain Transactions</CardTitle>
                                <CardDescription>Recent blockchain activity for this session</CardDescription>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            placeholder="Search transactions..."
                                            className="h-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Search className="h-4 w-4" />
                                            <span className="sr-only">Search transactions</span>
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select value={txFilter} onValueChange={setTxFilter}>
                                            <SelectTrigger className="h-8 w-[130px]">
                                                <SelectValue placeholder="Filter by type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="vote">Vote</SelectItem>
                                                <SelectItem value="session">Session</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="sm" className="h-8">
                                            <Download className="h-3.5 w-3.5 mr-1" />
                                            Export
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Hash</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Block</TableHead>
                                                <TableHead>Gas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTransactions.map((tx) => (
                                                <TableRow key={tx.hash}>
                                                    <TableCell className="font-medium">{tx.hash.substring(0, 10)}...</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                tx.type === "vote"
                                                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                                                                    : tx.type === "session"
                                                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                                                                        : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300"
                                                            }
                                                        >
                                                            {tx.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{tx.time}</TableCell>
                                                    <TableCell>{tx.block}</TableCell>
                                                    <TableCell>{tx.gas}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
