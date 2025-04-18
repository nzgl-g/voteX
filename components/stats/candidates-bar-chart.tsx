'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/shadcn-ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/shadcn-ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn-ui/select";
import { mockBarGraphData } from '@/lib/mock-data';
export const description = 'Interactive voting results chart';

// Sample vote data - replace with your actual data
const voteData = mockBarGraphData;

const ChartConfig = {
    views: {
        label: 'Vote Counts'
    },
    candidate1: {
        label: 'John Smith',
        color: 'var(--primary)'
    },
    candidate2: {
        label: 'Sarah Johnson',
        color: 'var(--destructive)'
    },
    candidate3: {
        label: 'Michael Wong',
        color: 'var(--accent)'
    },
    candidate4: {
        label: 'Michael Wong',
        color: 'var(--accent)'
    },
    candidate5: {
        label: 'Michael Wong',
        color: 'var(--accent)'
    },
};

export default function CandidatesBarGraph() {
    const [activeCandidate, setActiveCandidate] =
        React.useState<keyof typeof ChartConfig>('candidate1');

    const total = React.useMemo(
        () => ({
            candidate1: voteData.reduce((acc, curr) => acc + curr.candidate1, 0),
            candidate2: voteData.reduce((acc, curr) => acc + curr.candidate2, 0),
            candidate3: voteData.reduce((acc, curr) => acc + curr.candidate3, 0)
        }),
        []
    );

    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <Card className="@container/card">
            <CardHeader className="border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Voting Results</CardTitle>
                        <CardDescription>Daily votes for the past week</CardDescription>
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            value={activeCandidate}
                            onValueChange={(value) => setActiveCandidate(value as keyof typeof ChartConfig)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select candidate" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(ChartConfig)
                                    .filter(key => key !== 'views')
                                    .map((key) => (
                                        <SelectItem key={key} value={key}>
                                            {ChartConfig[key as keyof typeof ChartConfig].label} ({total[key as keyof typeof total]?.toLocaleString()} votes)
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {Object.keys(ChartConfig)
                        .filter(key => key !== 'views')
                        .map((key) => {
                            const candidate = key as keyof typeof ChartConfig;
                            return (
                                <div
                                    key={candidate}
                                    className={`p-4 rounded-lg ${activeCandidate === candidate ? 'bg-primary/10' : 'bg-muted/50'}`}
                                >
                                    <div className="text-sm text-muted-foreground">{ChartConfig[candidate].label}</div>
                                    <div className="text-2xl font-bold mt-1">
                                        {total[key as keyof typeof total]?.toLocaleString()} votes
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={ChartConfig}
                    className="aspect-auto h-[300px] w-full"
                >
                    <BarChart
                        data={voteData}
                        margin={{
                            left: 12,
                            right: 12
                        }}
                    >
                        <defs>
                            <linearGradient id="fillBar" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0.2}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                });
                            }}
                        />
                        <ChartTooltip
                            cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                            content={
                                <ChartTooltipContent
                                    className="w-[180px]"
                                    nameKey="views"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        });
                                    }}
                                />
                            }
                        />
                        <Bar
                            dataKey={activeCandidate}
                            fill="url(#fillBar)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}