import type { Session, Candidate, TeamMember, Subscription } from "./types"

// Mock subscription data
export const mockSubscription: Subscription = {
    id: "pro",
    name: "pro",
    price: 49,
    voterLimit: 10000,
    features: [
        "All voting types (polls, elections, referendums, etc.)",
        "Up to 10,000 voters",
        "KYC verification",
        "Full-time priority support",
    ],
    isRecommended: true,
}

// Mock team member data
export const mockTeamMembers: TeamMember[] = [
    {
        id: "tm1",
        fullName: "John Doe",
        role: "Admin",
        email: "john@example.com",
        sessionId: "session1",
    },
    {
        id: "tm2",
        fullName: "Jane Smith",
        role: "Moderator",
        email: "jane@example.com",
        sessionId: "session1",
    },
]

// Mock candidate data
export const mockCandidates: Candidate[] = [
    {
        id: "c1",
        fullName: "Alice Johnson",
        status: "Verified",
        assignedReviewer: mockTeamMembers[0],
        partyName: "Progressive Party",
        totalVotes: 1245,
        requiresReview: false,
        sessionId: "session1",
    },
    {
        id: "c2",
        fullName: "Bob Williams",
        status: "Verified",
        assignedReviewer: mockTeamMembers[1],
        partyName: "Conservative Union",
        totalVotes: 987,
        requiresReview: false,
        sessionId: "session1",
    },
    {
        id: "c3",
        fullName: "Carol Davis",
        status: "Verified",
        assignedReviewer: mockTeamMembers[0],
        partyName: "Green Alliance",
        totalVotes: 876,
        requiresReview: false,
        sessionId: "session1",
    },
    {
        id: "c4",
        fullName: "David Miller",
        status: "Pending",
        assignedReviewer: mockTeamMembers[1],
        partyName: "Liberty Coalition",
        totalVotes: 654,
        requiresReview: true,
        sessionId: "session1",
    },
    {
        id: "c5",
        fullName: "Eva Wilson",
        status: "Verified",
        assignedReviewer: mockTeamMembers[0],
        partyName: "People's Front",
        totalVotes: 432,
        requiresReview: false,
        sessionId: "session1",
    },
]

// Mock session data
export const mockSession: Session = {
    id: "session1",
    name: "City Council Election 2023",
    description: "Annual election for city council representatives",
    organizationName: "City Electoral Commission",
    banner: null,
    sessionLifecycle: {
        createdAt: "2023-01-15 09:00:00",
        scheduledAt: null,
        startedAt: "2023-06-01 08:00:00",
        endedAt: "2023-06-30 20:00:00",
    },
    type: "election",
    subtype: "Single",
    tournamentType: null,
    visibility: "public",
    resultVisibility: "post-completion",
    securityMethod: null,
    verificationMethod: "CVC",
    candidateStep: "Nomination",
    candidates: mockCandidates,
    options: null,
    secretPhrase: null,
    subscription: mockSubscription,
    teamMembers: mockTeamMembers,
}

// Mock votes data for charts
export const mockVotesData = [
    { name: "Alice Johnson", votes: 1245 },
    { name: "Bob Williams", votes: 987 },
    { name: "Carol Davis", votes: 876 },
    { name: "David Miller", votes: 654 },
    { name: "Eva Wilson", votes: 432 },
]

// Generate mock data for votes over time
export function generateMockVotesOverTime(timeRange: "day" | "week" | "month") {
    const data = []
    let totalPoints = 0

    if (timeRange === "day") {
        totalPoints = 24 // 24 hours
        const now = new Date()
        for (let i = 0; i < totalPoints; i++) {
            const time = new Date(now)
            time.setHours(time.getHours() - (totalPoints - i))
            data.push({
                time: time.toLocaleString(),
                votes: Math.floor(Math.random() * 50) + 10,
            })
        }
    } else if (timeRange === "week") {
        totalPoints = 7 // 7 days
        const now = new Date()
        for (let i = 0; i < totalPoints; i++) {
            const time = new Date(now)
            time.setDate(time.getDate() - (totalPoints - i))
            data.push({
                time: time.toLocaleString(),
                votes: Math.floor(Math.random() * 200) + 50,
            })
        }
    } else if (timeRange === "month") {
        totalPoints = 30 // 30 days
        const now = new Date()
        for (let i = 0; i < totalPoints; i++) {
            const time = new Date(now)
            time.setDate(time.getDate() - (totalPoints - i))
            data.push({
                time: time.toLocaleString(),
                votes: Math.floor(Math.random() * 500) + 100,
            })
        }
    }

    return data
}

// Generate mock data for candidate votes over time
export function generateCandidateVotesOverTime(candidateId: string, timeRange: "day" | "week" | "month") {
    const data = []
    let totalPoints = 0

    // Seed the random generator with the candidate ID to get consistent results
    const seed = candidateId.charCodeAt(0) + candidateId.charCodeAt(candidateId.length - 1)

    if (timeRange === "day") {
        totalPoints = 24
    } else if (timeRange === "week") {
        totalPoints = 7
    } else {
        totalPoints = 30
    }

    const now = new Date()
    for (let i = 0; i < totalPoints; i++) {
        const time = new Date(now)

        if (timeRange === "day") {
            time.setHours(time.getHours() - (totalPoints - i))
        } else {
            time.setDate(time.getDate() - (totalPoints - i))
        }

        // Use the seed to create somewhat deterministic but varied data
        const randomFactor = Math.sin(i * seed) * 0.5 + 0.5
        const votes = Math.floor(randomFactor * 30) + 5

        data.push({
            time: time.toLocaleString(),
            votes: votes,
        })
    }

    return data
}
