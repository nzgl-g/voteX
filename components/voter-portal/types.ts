
export type VotingType = 'poll' | 'election' | 'tournament';
export type SessionLifecycle = 'nominations' | 'upcoming' | 'started' | 'ended';

export interface VoteSession {
    id: string;
    title: string;
    description: string;
    votingType: VotingType;
    status: SessionLifecycle;
    startDate: Date;
    endDate: Date;
    candidates?: Candidate[];
}

export interface Candidate {
    id: string;
    fullName: string;
    description: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationalities: string[];
    promises: string;
    biography: string;
    experience: string;
    partyName: string;
    officialPaper?: File | null;
    imageUrl?: string;
}