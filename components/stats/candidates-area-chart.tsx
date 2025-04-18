'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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

import { mockAreaGraphData } from '@/lib/mock-data';

const voteTimelineData = mockAreaGraphData;

const ChartConfig = {
    votes: {
        label: 'Votes'
    },
    candidate1: {
        label: 'John Smith',
        color: 'var(--primary)'
    },
    candidate2: {
        label: 'Sarah Johnson',
        color: 'var(--destructive)'
    }
};

export default function CandidateAreaChart() {
    const leadingCandidateData = voteTimelineData.map((item) => item.candidate1 || 0);
    const dataLength = leadingCandidateData.length;

    const currentVotes = dataLength >= 1 ? leadingCandidateData[dataLength - 1] : 0;
    const previousVotes = dataLength >= 2 ? leadingCandidateData[dataLength - 2] : currentVotes;

    const growthPercentage =
        previousVotes !== 0
            ? (((currentVotes - previousVotes) / previousVotes) * 100).toFixed(1)
            : '0.0';

    return (
        <Card className='@container/card'>
            <CardHeader>
                <CardTitle>Vote Accumulation Trends</CardTitle>
                <CardDescription>
                    Total votes collected over the election period
                </CardDescription>
            </CardHeader>
            <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
                <ChartContainer config={ChartConfig} className='aspect-auto h-[250px] w-full'>
                    <AreaChart
                        data={voteTimelineData}
                        margin={{ left: 12, right: 12 }}
                    >
                        <defs>
                            <linearGradient id='fillCandidate1' x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='5%' stopColor={ChartConfig.candidate1.color} stopOpacity={1.0} />
                                <stop offset='95%' stopColor={ChartConfig.candidate1.color} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id='fillCandidate2' x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='5%' stopColor={ChartConfig.candidate2.color} stopOpacity={0.8} />
                                <stop offset='95%' stopColor={ChartConfig.candidate2.color} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey='period'
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = value.split(' ')[0];
                                const [year, month, day] = date.split(':');
                                return `${month}/${day}`;
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator='dot'
                                    labelFormatter={(value) => {
                                        const [datePart, timePart] = value.split(' ');
                                        const [year, month, day] = datePart.split(':');
                                        return `${month}/${day}/${year} ${timePart}`;
                                    }}
                                />
                            }
                        />
                        <Area
                            dataKey='candidate2'
                            type='monotone'
                            fill='url(#fillCandidate2)'
                            stroke={ChartConfig.candidate2.color}
                            stackId='a'
                            name={ChartConfig.candidate2.label}
                        />
                        <Area
                            dataKey='candidate1'
                            type='monotone'
                            fill='url(#fillCandidate1)'
                            stroke={ChartConfig.candidate1.color}
                            stackId='a'
                            name={ChartConfig.candidate1.label}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className='flex w-full items-start gap-2 text-sm'>
                    <div className='grid gap-2'>
                        <div className='flex items-center gap-2 leading-none font-medium'>
                            {ChartConfig.candidate1.label} trending up by {growthPercentage}% today
                            <IconTrendingUp className='h-4 w-4' />
                        </div>
                        <div className='text-muted-foreground flex items-center gap-2 leading-none'>
                            April 10 – April 16, 2025
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
