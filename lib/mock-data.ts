import {Candidate, Voter ,KycStat} from './types';
import { TeamMember } from './types';
import {Session} from './types';
import {Subscription} from './types';

export const freeSubscription: Subscription = {
    id: "sub-free-001",
    name: "free",
    price: 0,
    voterLimit: 500,
    features: ["Basic Dashboard", "Public Voting", "Limited Support"],
    isRecommended: false,
    addOns: []
};
export const proSubscription: Subscription = {
    id: "sub-pro-001",
    name: "pro",
    price: 49.99,
    voterLimit: 10000,
    features: ["Custom Branding", "Priority Support", "Analytics Dashboard", "Secret Phrase Voting"],
    isRecommended: true,
    addOns: [
        {
            id: "addon-pro-001",
            name: "Extra Voter Pack",
            description: "Add 5,000 more voters",
            price: 9.99
        },
        {
            id: "addon-pro-002",
            name: "Data Export",
            description: "Export data in CSV and JSON formats",
            price: 4.99
        }
    ]
};
export const enterpriseSubscription: Subscription = {
    id: "sub-ent-001",
    name: "enterprise",
    price: 199.99,
    voterLimit: null, // Unlimited voters
    features: ["Custom Workflows", "Dedicated Manager", "Full API Access", "Unlimited Voters"],
    isRecommended: false,
    addOns: [
        {
            id: "addon-ent-001",
            name: "White Labeling",
            description: "Remove all platform branding",
            price: 29.99
        },
        {
            id: "addon-ent-002",
            name: "24/7 SLA Support",
            description: "Round-the-clock technical support",
            price: 49.99
        }
    ]
};
export const mockTeamMember: TeamMember[] = [
    {
        id: "team-001",
        fullName: "Elijah Daniels",
        role: "Reviewer",
        email: "elijah.daniels@nycouncil.org",
        sessionId: "session-005"
    },
    {
        id: "team-002",
        fullName: "Sofia Nkrumah",
        role: "Moderator",
        email: "sofia.nkrumah@nycouncil.org",
        sessionId: "session-005"
    },
    {
        id: "team-003",
        fullName: "Marcus Bello",
        role: "Coordinator",
        email: "marcus.bello@nycouncil.org",
        sessionId: "session-005"
    },
    {
        id: "team-004",
        fullName: "Jade Lin",
        role: "Admin",
        email: "jade.lin@nycouncil.org",
        sessionId: "session-005"
    },
    {
        id: "team-005",
        fullName: "Omar Khaled",
        role: "Tech Lead",
        email: "omar.khaled@nycouncil.org",
        sessionId: "session-005"
    },
    {
        id: "team-006",
        fullName: "Lucía Mendoza",
        role: "Support",
        email: "lucia.mendoza@nycouncil.org",
        sessionId: "session-005"
    }
];
export const mockCandidates: Candidate[] = [
    {
        id: 'cand-001',
        fullName: 'Alice Johnson',
        status: 'Verified',
        assignedReviewer: {
            id: 'rev-01',
            fullName: 'Marcus Green',
            role: 'Lead Reviewer',
            email: 'marcus.green@example.com',
            sessionId: 'session-1001',
        },
        partyName: 'Progressive Alliance',
        totalVotes: 1523,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-002',
        fullName: 'Benjamin Lee',
        status: 'Pending',
        assignedReviewer: null,
        partyName: 'Unity Front',
        totalVotes: 0,
        requiresReview: true,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-003',
        fullName: 'Chloe Martinez',
        status: 'Refused',
        assignedReviewer: {
            id: 'rev-02',
            fullName: 'Diana Rivera',
            role: 'Compliance Officer',
            email: 'diana.rivera@example.com',
            sessionId: 'session-1001',

        },
        partyName: 'People’s Voice',
        totalVotes: 0,
        requiresReview: false,
        sessionId: 'session-1003',
    },
    {
        id: 'cand-004',
        fullName: 'David Kim',
        status: 'Verified',
        assignedReviewer: {
            id: 'rev-03',
            fullName: 'Sophie Zhang',
            role: 'Reviewer',
            email: 'sophie.zhang@example.com',
            sessionId: 'session-1001',

        },
        partyName: 'Future Movement',
        totalVotes: 897,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-005',
        fullName: 'Emily Carter',
        status: 'Pending',
        assignedReviewer: null,
        partyName: 'Green Unity',
        totalVotes: 0,
        requiresReview: true,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-006',
        fullName: 'Fatima Al-Sayeed',
        status: 'Verified',
        assignedReviewer: {
            id: 'rev-04',
            fullName: 'Tomáš Novak',
            role: 'Senior Auditor',
            email: 'tomas.novak@example.com',
            sessionId: 'session-1001',
        },
        partyName: 'Liberty Coalition',
        totalVotes: 2431,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-007',
        fullName: 'Jorge Ramirez',
        status: 'Refused',
        assignedReviewer: {
            id: 'rev-05',
            fullName: 'Hannah Müller',
            role: 'Legal Analyst',
            email: 'hannah.mueller@example.com',
            sessionId: 'session-1001',

        },
        partyName: 'Justice League',
        totalVotes: 0,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-008',
        fullName: 'Ling Wei',
        status: 'Pending',
        assignedReviewer: null,
        partyName: 'People’s Reform',
        totalVotes: 0,
        requiresReview: true,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-009',
        fullName: 'Noah Thompson',
        status: 'Verified',
        assignedReviewer: {
            id: 'rev-06',
            fullName: 'Isabella Rossi',
            role: 'Reviewer',
            email: 'isabella.rossi@example.com',
            sessionId: 'session-1001',

        },
        partyName: 'Equal Future',
        totalVotes: 1880,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-010',
        fullName: 'Zara Patel',
        status: 'Pending',
        assignedReviewer: null,
        partyName: 'New Dawn',
        totalVotes: 0,
        requiresReview: true,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-011',
        fullName: 'Oliver Becker',
        status: 'Verified',
        assignedReviewer: {
            id: 'rev-07',
            fullName: 'Amina Yusuf',
            role: 'Ethics Reviewer',
            email: 'amina.yusuf@example.com',
            sessionId: 'session-1001',

        },
        partyName: 'Freedom Path',
        totalVotes: 2112,
        requiresReview: false,
        sessionId: 'session-1001',
    },
    {
        id: 'cand-012',
        fullName: 'Samantha O’Connell',
        status: 'Refused',
        assignedReviewer: {
            id: 'rev-08',
            fullName: 'Raj Mehta',
            role: 'Compliance Officer',
            email: 'raj.mehta@example.com',
            sessionId: 'session-1001',
        },
        partyName: 'United Voice',
        totalVotes: 0,
        requiresReview: false,
        sessionId: 'session-1001',
    }
];
export const mockSession: Session = {
    id: "session-005",
    title: "National Youth Election 2025",
    description: "A nationwide election to select youth representatives.",
    organizationName: "National Youth Council",
    banner: "https://example.com/banners/youth-election.png",
    sessionLifecycle: {
        createdAt: "2025-03-01 10:00:00",
        scheduledAt: "2025-05-01 09:00:00",
        startedAt: "2025-05-01 09:15:00",
        endedAt: "2025-05-10 18:00:00"
    },
    type: "election",
    subtype: "Single",
    tournamentType: null,
    accessLevel: "Public",
    securityMethod: "Secret Phrase",
    verificationMethod: "KYC",
    candidateStep: "Nomination",
    options: null,
    secretPhrase: "youth_power_2025",
    subscription: freeSubscription,
    candidates: mockCandidates,
    teamMembers:mockTeamMember,
};
export const mockVoters: Voter[] = [
    {
        id: "voter-001",
        fullName: "Layla Hassan",
        email: "layla.hassan@example.com",
        dob: "1998-07-14",
        pob: "Cairo, Egypt",
        nationality: "Egyptian",
        gender: "Female",
        kycStatus: "Verified"
    },
    {
        id: "voter-002",
        fullName: "Daniel Okoye",
        email: "daniel.okoye@example.com",
        dob: "1995-11-22",
        pob: "Lagos, Nigeria",
        nationality: "Nigerian",
        gender: "Male",
        kycStatus: "Pending"
    },
    {
        id: "voter-003",
        fullName: "Fatima Khan",
        email: "fatima.khan@example.com",
        dob: "2000-01-09",
        pob: "Karachi, Pakistan",
        nationality: "Pakistani",
        gender: "Female",
        kycStatus: "Refused"
    },
    {
        id: "voter-004",
        fullName: "Lucas Silva",
        email: "lucas.silva@example.com",
        dob: "1992-05-04",
        pob: "São Paulo, Brazil",
        nationality: "Brazilian",
        gender: "Male",
        kycStatus: "Verified"
    }
];
export const mockKycStats: KycStat[] = [
    {
        userId: "voter-001",
        verificationStatus: "Verified",
        verificationDate: "2025-04-10",
        description: "Verified using national ID and facial recognition"
    },
    {
        userId: "voter-002",
        verificationStatus: "Pending",
        verificationDate: "2025-04-13",
        description: "Awaiting document verification"
    },
    {
        userId: "voter-003",
        verificationStatus: "Refused",
        verificationDate: "2025-04-12",
        description: "Image mismatch detected in facial analysis"
    },
    {
        userId: "voter-004",
        verificationStatus: "Verified",
        verificationDate: "2025-04-09",
        description: "Verified via KYC partner API"
    }
];
export const mockAreaGraphData = [
    { period: '2025:04:10 12:00:00', candidate1: 425, candidate2: 310 },
    { period: '2025:04:11 12:00:00', candidate1: 852, candidate2: 724 },
    { period: '2025:04:12 12:00:00', candidate1: 1105, candidate2: 986 },
    { period: '2025:04:13 12:00:00', candidate1: 1234, candidate2: 1151 },
    { period: '2025:04:14 12:00:00', candidate1: 1358, candidate2: 1204 },
    { period: '2025:04:15 12:00:00', candidate1: 1471, candidate2: 1255 },
    { period: '2025:04:16 12:00:00', candidate1: 1543, candidate2: 1286 },
    { period: '2025:04:17 12:00:00', candidate1: 1622, candidate2: 1333 },
    { period: '2025:04:18 12:00:00', candidate1: 1715, candidate2: 1378 },
    { period: '2025:04:19 12:00:00', candidate1: 1802, candidate2: 1431 },
    { period: '2025:04:20 12:00:00', candidate1: 1887, candidate2: 1490 },
    { period: '2025:04:21 12:00:00', candidate1: 1976, candidate2: 1534 },
    { period: '2025:04:22 12:00:00', candidate1: 2055, candidate2: 1599 },
    { period: '2025:04:23 12:00:00', candidate1: 2128, candidate2: 1657 },
    { period: '2025:04:24 12:00:00', candidate1: 2196, candidate2: 1708 },
    { period: '2025:04:25 12:00:00', candidate1: 2275, candidate2: 1760 },
    { period: '2025:04:26 12:00:00', candidate1: 2342, candidate2: 1812 },
    { period: '2025:04:27 12:00:00', candidate1: 2410, candidate2: 1869 },
    { period: '2025:04:28 12:00:00', candidate1: 2485, candidate2: 1933 },
    { period: '2025:04:29 12:00:00', candidate1: 2572, candidate2: 1992 },
    { period: '2025:04:30 12:00:00', candidate1: 2644, candidate2: 2051 },
    { period: '2025:05:01 12:00:00', candidate1: 2729, candidate2: 2120 },
    { period: '2025:05:02 12:00:00', candidate1: 2800, candidate2: 2183 },
    { period: '2025:05:03 12:00:00', candidate1: 2878, candidate2: 2255 },
    { period: '2025:05:04 12:00:00', candidate1: 2950, candidate2: 2320 },
    { period: '2025:05:05 12:00:00', candidate1: 3017, candidate2: 2387 },
    { period: '2025:05:06 12:00:00', candidate1: 3084, candidate2: 2442 },
    { period: '2025:05:07 12:00:00', candidate1: 3150, candidate2: 2505 },
    { period: '2025:05:08 12:00:00', candidate1: 3227, candidate2: 2570 },
    { period: '2025:05:09 12:00:00', candidate1: 3295, candidate2: 2641 },
    { period: '2025:05:10 12:00:00', candidate1: 3374, candidate2: 2708 }
];
export const mockBarGraphData = [
    {
        date: '2025-04-01',
        candidate1: 145,
        candidate2: 110,
        candidate3: 85,
        views: 'April 1'
    },
    {
        date: '2025-04-02',
        candidate1: 160,
        candidate2: 130,
        candidate3: 95,
        views: 'April 2'
    },
    {
        date: '2025-04-03',
        candidate1: 170,
        candidate2: 140,
        candidate3: 105,
        views: 'April 3'
    },
    {
        date: '2025-04-04',
        candidate1: 180,
        candidate2: 160,
        candidate3: 120,
        views: 'April 4'
    },
    {
        date: '2025-04-05',
        candidate1: 190,
        candidate2: 170,
        candidate3: 130,
        views: 'April 5'
    },
    {
        date: '2025-04-06',
        candidate1: 210,
        candidate2: 180,
        candidate3: 140,
        views: 'April 6'
    },
    {
        date: '2025-04-07',
        candidate1: 220,
        candidate2: 190,
        candidate3: 150,
        views: 'April 7'
    }
];
export const mockPieGraphData = [
    { candidate: 'johnsmith', votes: 1543, fill: 'var(--primary)', name: 'John Smith' },
    { candidate: 'sarahjohnson', votes: 1286, fill: 'var(--primary-light)', name: 'Sarah Johnson' },
    { candidate: 'michaelwong', votes: 821, fill: 'var(--primary-lighter)', name: 'Michael Wong' },
    { candidate: 'elenarodriguez', votes: 546, fill: 'var(--primary-dark)', name: 'Elena Rodriguez' },
    { candidate: 'jamalwashington', votes: 318, fill: 'var(--primary-darker)', name: 'Jamal Washington' }
];
export const mockCandidatesVotesCardGraphData =  [
    {
        name: 'John Smith',
        party: 'Progressive Party',
        avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
        fallback: 'JS',
        votes: '1,543 votes',
        percentage: '34.2%'
    },
    {
        name: 'Sarah Johnson',
        party: 'Conservative Alliance',
        avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
        fallback: 'SJ',
        votes: '1,286 votes',
        percentage: '28.5%'
    },
    {
        name: 'Michael Wong',
        party: 'Independent',
        avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
        fallback: 'MW',
        votes: '821 votes',
        percentage: '18.2%'
    },
    {
        name: 'Elena Rodriguez',
        party: 'Liberty Coalition',
        avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
        fallback: 'ER',
        votes: '546 votes',
        percentage: '12.1%'
    },
    {
        name: 'Jamal Washington',
        party: 'Green Movement',
        avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
        fallback: 'JW',
        votes: '318 votes',
        percentage: '7.0%'
    }
];