import { ReactNode } from "react";

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

// Session card lifecycle status
export interface SessionLifecycleStatus {
    status: string;
    label: string;
    color: string;
    icon?: ReactNode;
}

export interface SessionCardSkeletonProps {
    count?: number;
}

// Props for SessionCard component
export interface SessionCardProps {
    session: {
        _id: string;
        name: string;
        description?: string | null;
        organizationName?: string | null;
        banner?: string | null;
        type: 'election' | 'poll' | 'tournament';
        subtype?: 'single' | 'multiple' | 'ranked';
        securityMethod?: string;
        verificationMethod?: string;
        sessionLifecycle?: {
            scheduledAt?: {
                start?: string;
                end?: string;
            };
            startedAt?: string;
            endedAt?: string;
        };
        candidates?: any[];
        options?: any[];
        contractAddress?: string;
    };
    onJoinAsCandidate: (session: any) => void;
    onCastVote: (session: any) => void;
    onShowResults: (session: any) => void;
    onViewProfile: (session: any) => void;
}

// Props for SecretPhraseDialog component
export interface SecretPhraseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (phrase: string) => Promise<void>;
    isSubmitting: boolean;
}