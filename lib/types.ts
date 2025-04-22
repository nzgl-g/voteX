// Candidate Related Data Types
export interface Candidate {
    id: string;
    fullName: string;
    status: 'Verified' | 'Pending' | 'Refused';
    assignedReviewer: TeamMember | null;
    partyName: string;
    totalVotes: number;
    requiresReview: boolean;
    sessionId: string;
}

// Session Related Data Types
export interface Session {
    id: string;
    title: string;
    description?: string | null;
    organizationName?: string | null;
    banner?: string | null; // Background image URL
    sessionLifecycle: {
        createdAt: string;     // Format: YYYY-MM-DD HH:mm:ss
        scheduledAt?: string | null; // Optional future scheduling (its a time range)
        startedAt: string;     // Format: YYYY-MM-DD HH:mm:ss
        endedAt: string;       // Format: YYYY-MM-DD HH:mm:ss
    };
    type: 'poll' | 'election' | 'tournament';
    subtype: 'Ranked' | 'Multiple' | 'Single' | 'Double Elimination' | 'Single Elimination';
    tournamentType?: 'Round Robin' | 'Knockout' | 'Swiss' | null;
    accessLevel: 'Public' | 'Private';
    securityMethod?: 'Secret Phrase' | 'Area Restriction' | null;
    verificationMethod?: 'KYC' | 'CVC' | null;
    candidateStep: 'Nomination' | 'Invitation';
    candidates?: Candidate[] | null;
    options?: string | null;
    secretPhrase?: string | null;
    subscription: Subscription;
    teamMembers: TeamMember[];
}

// Team Related Data Types
export interface TeamMember {
    id: string;
    fullName: string;
    role: string;
    email: string;
    sessionId: string;
}

// Task Related Data Types
export interface Task {
    sessionId: string;
    title: string;
    description: string;
    assignedTo: TeamMember[];
    assignedBy: TeamMember;
    priority: 'High' | 'Medium' | 'Low';
    createdAt: string; // Format: YYYY-MM-DD HH:mm:ss
    endedAt: string;   // Format: YYYY-MM-DD HH:mm:ss
    color: string;     // Hex color code (e.g. #FF5733)
}

// Voter Related Data Types
export interface Voter {
    id: string;
    fullName: string;
    email: string;
    dob?: string | null; // Format: YYYY-MM-DD
    pob?: string | null; // Place of birth
    nationality?: string | null;
    gender: 'Male' | 'Female';
    kycStatus: 'Verified' | 'Pending' | 'Refused';
}

// Statistics Related Data Types
export interface KycStat {
    userId: string;
    verificationStatus: 'Verified' | 'Pending' | 'Refused';
    verificationDate: string; // Format: YYYY-MM-DD
    description: string;
}

// Option Related Data Types
export interface Option {
    id: string;
    name: string;
    description?: string | null;
    totalVotes: number;
    sessionId: string;
}

// Vote Related Data Types
export interface Vote {
    id: string;
    votedAt: string; // Format: YYYY-MM-DD HH:mm:ss
    selectionID: Candidate['id'] | Option['id'];
    location?: string | null;
}

// Subscription Related Data Types
export interface Subscription {
    id: string;
    name: 'free' | 'pro' | 'enterprise';
    price: number;
    voterLimit?: number | null;
    features: string[];
    isRecommended: boolean;
    addOns: {
        id: string;
        name: string;
        description: string;
        price: number;
    }[];
}

export interface AreaChartData {
    period:string;
}




//Calendar Related Data Types
export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    color?: EventColor;
    label?: string;
    location?: string;
}

export type EventColor = "blue" | "orange" | "violet" | "rose" | "emerald";
