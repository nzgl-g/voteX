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
            <SiteHeader title="Get real-time insights into your voting session." />
    )
}
