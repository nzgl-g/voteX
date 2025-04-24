import {SessionProfile} from "@/components/profile/session-profile";
import {SiteHeader} from "@/components/sidebar/site-header";
import React from "react";
import {mockCandidates, mockTeamMember} from "@/lib/mock-data";

// Mock data for demonstration
const mockSession = {
    id: "sess-123456",
    title: "City Council Election 2025",
    description: "Annual election for city council representatives",
    organizationName: "City Government",
    banner: "/placeholder.svg?height=200&width=1200",
    sessionLifecycle: {
        createdAt: "2025-01-15 10:00:00",
        scheduledAt: "2025-04-25 08:00:00 - 2025-04-25 20:00:00",
        startedAt: "2025-04-25 08:00:00",
        endedAt: "2025-04-25 20:00:00",
    },
    type: "election",
    subtype: "Ranked",
    tournamentType: null,
    accessLevel: "Public",
    securityMethod: "Secret Phrase",
    verificationMethod: "KYC",
    candidateStep: "Invitation",
    secretPhrase: "democracy2025",
    subscription: {
        id: "sub-1",
        name: "pro",
        price: 99.99,
        voterLimit: 10000,
        features: ["KYC Verification", "Advanced Analytics", "Priority Support"],
        isRecommended: true,
        addOns: [
            {
                id: "addon-1",
                name: "Extended Voting Period",
                description: "Extend voting period up to 7 days",
                price: 29.99,
            },
        ],
    },
    teamMembers: [
        {
            id: "tm-1",
            fullName: "Jane Smith",
            role: "Admin",
            email: "jane.smith@example.com",
            sessionId: "sess-123456",
        },
    ],
    candidates: [
        {
            id: "cand-1",
            fullName: "John Doe",
            status: "Verified",
            assignedReviewer: null,
            partyName: "Progress Party",
            totalVotes: 1250,
            requiresReview: false,
            sessionId: "sess-123456",
        },
        {
            id: "cand-2",
            fullName: "Sarah Johnson",
            status: "Verified",
            assignedReviewer: null,
            partyName: "Future Alliance",
            totalVotes: 980,
            requiresReview: false,
            sessionId: "sess-123456",
        },
        {
            id: "cand-3",
            fullName: "Michael Chen",
            status: "Pending",
            assignedReviewer: null,
            partyName: "Citizens United",
            totalVotes: 0,
            requiresReview: true,
            sessionId: "sess-123456",
        },
    ],
}
const mockCandidtates = mockCandidates;
const mockMember = mockTeamMember;

export default function Home() {
    return (
        <><SiteHeader title="Get real-time insights into your voting session."/>
            <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <SessionProfile session={mockSession  } candidates={mockCandidates} teamMembers={mockMember}/>
            </main>
        </>
    )
}