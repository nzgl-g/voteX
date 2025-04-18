"use client"
import { SiteHeader } from "@/components/sidebar/site-header"

// Mock Data Without API
import CandidateAreaChart from "@/components/stats/candidates-area-chart"
import CandidatesBarGraph from "@/components/stats/candidates-bar-chart"
import { CandidatesPieGraph } from "@/components/stats/pie-graph"
import { CandidateVoteResults } from "@/components/stats/candidates-votes"
import CountdownCard from "@/components/stats/countdown-card"
import TotalVotesCard from "@/components/stats/total-vote-card"
import React from "react"

export default function Page() {
    return (

        <div className="flex h-full flex-col space-y-4">
            <SiteHeader title="Get real-time insights into your voting session." />

            <div className="flex flex-1 flex-col space-y-2 p-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Hi, Welcome back 👋
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2
                    *:data-[slot=card]:from-primary/5
                    *:data-[slot=card]:to-card
                    dark:*:data-[slot=card]:bg-card
                    *:data-[slot=card]:bg-gradient-to-t
                    *:data-[slot=card]:shadow-xs">
                    <TotalVotesCard sessionStatus="live" />
                    <CountdownCard sessionStatus="live" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4">
                        <CandidatesBarGraph />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                        <CandidateVoteResults />
                    </div>
                    <div className="col-span-4">
                        <CandidateAreaChart />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                        <CandidatesPieGraph />
                    </div>
                </div>
            </div>
        </div>
    )
}
