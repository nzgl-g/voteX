
export type PlanType = "free" | "pro" | "enterprise";

export type VotingSessionType = "poll" | "election" | "tournament";

export type VotingMode = 
  | "single-choice"
  | "multiple-choice" 
  | "ranked-choice"
  | "single-elimination"
  | "double-elimination"
  | "round-robin"
  | "knockout"
  | "swiss";

export type AccessControlType = "public" | "private" | "secret-phrase" | "csv-invite";

export type VoterVerificationType = "standard" | "kyc";

export type CandidateEntryType = "manual" | "email" | "open";

export interface FormStep {
  id: string;
  label: string;
  description: string;
}

export interface VotingSessionFormProps {
  plan: PlanType;
}

export interface SummaryStepProps {
  formData: {
    title: string;
    description: string;
    organization: string;
    banner: { id: string; url: string };
    sessionType: string;
    votingMode: string;
    startDate: Date;
    endDate: Date;
    preparationSchedule: Date | null;
    accessControl: string;
    secretPhrase: string;
    csvInviteFile: File | null;
    displayLiveResults: boolean;
    verificationMethod: string;
    options: { title: string; description: string }[];
    candidateEntryMethod: string;
    candidates: { name: string; email: string }[];
  };
  plan: PlanType;
  onEditStep: (stepIndex: number) => void;
}
