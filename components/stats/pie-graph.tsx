'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/shadcn-ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/shadcn-ui/chart';
import {mockPieGraphData} from "@/lib/mock-data";

const voteData = mockPieGraphData;

const ChartConfig = {
    votes: {
        label: 'Votes'
    },
    johnsmith: {
        label: 'John Smith',
        color: 'var(--primary)'
    },
    sarahjohnson: {
        label: 'Sarah Johnson',
        color: 'var(--primary)'
    },
    michaelwong: {
        label: 'Michael Wong',
        color: 'var(--primary)'
    },
    elenarodriguez: {
        label: 'Elena Rodriguez',
        color: 'var(--primary)'
    },
    jamalwashington: {
        label: 'Jamal Washington',
        color: 'var(--primary)'
    }
};
export function CandidatesPieGraph() {
    const totalVotes = React.useMemo(() => {
        return voteData.reduce((acc, curr) => acc + curr.votes, 0);
    }, []);

    const leadingCandidate = React.useMemo(() => {
        return voteData.reduce((max, curr) => max.votes > curr.votes ? max : curr);
    }, []);

    const leadingPercentage = ((leadingCandidate.votes / totalVotes) * 100).toFixed(1);

    return (
        <Card className='@container/card'>
            <CardHeader>
                <CardTitle>Election Results Distribution</CardTitle>
                <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Total votes by candidate for the April 2025 election
          </span>
                    <span className='@[540px]/card:hidden'>Vote distribution</span>
                </CardDescription>
            </CardHeader>
            <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
                <ChartContainer
                    config={ChartConfig}
                    className='mx-auto aspect-square h-[250px]'
                >
                    <PieChart>
                        <defs>
                            {voteData.map((item, index) => (
                                <linearGradient
                                    key={item.candidate}
                                    id={`fill${item.candidate}`}
                                    x1='0'
                                    y1='0'
                                    x2='0'
                                    y2='1'
                                >
                                    <stop
                                        offset='0%'
                                        stopColor='var(--primary)'
                                        stopOpacity={1 - index * 0.15}
                                    />
                                    <stop
                                        offset='100%'
                                        stopColor='var(--primary)'
                                        stopOpacity={0.8 - index * 0.15}
                                    />
                                </linearGradient>
                            ))}
                        </defs>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    nameFormatter={(name) => {
                                        const candidateData = voteData.find(d => d.candidate === name);
                                        return candidateData ? candidateData.name : name;
                                    }}
                                    valueFormatter={(value) => `${value.toLocaleString()} votes`}
                                />
                            }
                        />
                        <Pie
                            data={voteData.map((item) => ({
                                ...item,
                                fill: `url(#fill${item.candidate})`
                            }))}
                            dataKey='votes'
                            nameKey='candidate'
                            innerRadius={60}
                            strokeWidth={2}
                            stroke='var(--background)'
                            label={({ name, percent }) => {
                                const candidateData = voteData.find(d => d.candidate === name);
                                return candidateData ? `${(percent * 100).toFixed(0)}%` : '';
                            }}
                            labelLine={false}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor='middle'
                                                dominantBaseline='middle'
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className='fill-foreground text-3xl font-bold'
                                                >
                                                    {totalVotes.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className='fill-muted-foreground text-sm'
                                                >
                                                    Total Votes
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col gap-2 text-sm'>
                <div className='flex items-center gap-2 leading-none font-medium'>
                    {leadingCandidate.name} leads with {leadingPercentage}% of votes{' '}
                    <IconTrendingUp className='h-4 w-4' />
                </div>
                <div className='text-muted-foreground leading-none'>
                    Based on votes tallied as of April 16, 2025 at 12:00:00
                </div>
            </CardFooter>
        </Card>
    );
}