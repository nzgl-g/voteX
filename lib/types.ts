// Candidate Related Data Types
export interface Candidate {
  id: string;
  fullName: string;
  status: "Verified" | "Pending" | "Refused";
  assignedReviewer: TeamMember | null;
  partyName: string;
  totalVotes: number;
  requiresReview: boolean;
  sessionId: string;
}

// Session Related Data Types
export interface Session {
  id: string;
  name: string;
  description?: string | null;
  organizationName?: string | null;
  banner?: string | null; // Background image URL
  sessionLifecycle: {
    createdAt: string; // Format: YYYY-MM-DD HH:mm:ss
    scheduledAt?: {
      start: string | null;
      end: string | null;
    } | null; // Optional future scheduling as an object with start and end
    startedAt: string; // Format: YYYY-MM-DD HH:mm:ss
    endedAt: string; // Format: YYYY-MM-DD HH:mm:ss
  };
  type: "poll" | "election" | "tournament";
  subtype:
    | "Ranked"
    | "Multiple"
    | "Single"
    | "Double Elimination"
    | "Single Elimination";
  tournamentType?: "Round Robin" | "Knockout" | "Swiss" | null;
  accessLevel: "Public" | "Private";
  securityMethod?: "Secret Phrase" | "Area Restriction" | null;
  verificationMethod?: "S" | "CVC" | null;
  candidateStep: "Nomination" | "Invitation";
  candidates?: Candidate[] | null;
  options?: string | null;
  secretPhrase?: string | null;
  subscription: Subscription;
  teamMembers: TeamMember[];
}

// Team Related Data Types
//this is your code
export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  email: string;
  sessionId: string;
}
//READ THIS NIGGA
//these are changes chatgpt asked to make TO TEAM MEMBER so that the back and front
//can be linked better. use it or build something else
// export interface TeamMember {
//     id: string;            // Refers to the user ID
//     fullName: string;      // User's full name
//     role: string;          // Role of the team member (e.g., leader or member)
//     email: string;         // User's email
//     teamId: string;        // Reference to the team (could be derived from the backend)
//     sessionId?: string;    // Optional: If session is needed in the context
// }

// Task Related Data Types
export interface Task {
  sessionId: string;
  title: string;
  description: string;
  assignedTo: TeamMember[];
  assignedBy: TeamMember;
  priority: "High" | "Medium" | "Low";
  createdAt: string; // Format: YYYY-MM-DD HH:mm:ss
  endedAt: string; // Format: YYYY-MM-DD HH:mm:ss
  color: string; // Hex color code (e.g. #FF5733)
}

// Voter Related Data Types
export interface Voter {
  id: string;
  fullName: string;
  email: string;
  dob?: string | null; // Format: YYYY-MM-DD
  pob?: string | null; // Place of birth
  nationality?: string | null;
  gender: "Male" | "Female";
  kycStatus: "Verified" | "Pending" | "Refused";
}

// Statistics Related Data Types
export interface KycStat {
  userId: string;
  verificationStatus: "Verified" | "Pending" | "Refused";
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
  selectionID: Candidate["id"] | Option["id"];
  location?: string | null;
}

// Subscription Related Data Types
export interface Subscription {
  id: string;
  name: "free" | "pro" | "enterprise";
  price: number | null;
  voterLimit?: number | null;
  features: string[];
  isRecommended: boolean;
}

export const subscriptions: Subscription[] = [
  {
    id: "free",
    name: "free",
    price: 0,
    voterLimit: 100,
    features: [
      "Poll voting only",
      "Up to 100 voters",
      "Standard verification",
      "No support",
    ],
    isRecommended: false,
  },
  {
    id: "pro",
    name: "pro",
    price: 49, // Assuming this is per session
    voterLimit: 10000,
    features: [
      "All voting types (polls, elections, referendums, etc.)",
      "Up to 10,000 voters",
      "KYC verification",
      "Full-time priority support",
    ],
    isRecommended: true,
  },
  {
    id: "enterprise",
    name: "enterprise",
    price: null, // "Contact Sales"
    voterLimit: null, // unlimited
    features: [
      "Private blockchain deployment",
      "Unlimited voters and votes",
      "All advanced voting types",
      "Advanced KYC verification",
      "Dedicated full-time support & onboarding",
    ],
    isRecommended: false,
  },
];

export interface AreaChartData {
  period: string;
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
  etiquette?: string;
}

export type EventColor = "blue" | "orange" | "violet" | "rose" | "emerald";
