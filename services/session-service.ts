import baseApi from './base-api';

export interface SessionLifecycle {
  createdAt?: string;
  scheduledAt?: {
    start: string;
    end: string;
  };
  startedAt?: string;
  endedAt?: string;
}

export interface Subscription {
  name: 'free' | 'pro' | 'enterprise';
  price: number;
  voterLimit?: number;
  features?: string[];
  isRecommended?: boolean;
}

export interface Candidate {
  _id?: string;
  user: string;
  assignedReviewer?: string;
  partyName: string;
  totalVotes?: number;
  voteCount?: number;
  requiresReview?: boolean;
  paper?: string;
  fullName: string;
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
  blockchainVerified?: boolean;
}

export interface PollOption {
  _id?: string;
  name: string;
  description?: string;
  totalVotes?: number;
  voteCount?: number;
  blockchainVerified?: boolean;
}

export interface SessionBase {
  _id?: string;
  name: string;
  description?: string;
  organizationName?: string;
  banner?: string;
  type: 'election' | 'poll' | 'tournament';
  subtype: 'single' | 'multiple' | 'ranked' | 'single elimination' | 'double elimination';
  accessLevel: 'Public' | 'Private';
  subscription: Subscription;
  sessionLifecycle: SessionLifecycle;
  securityMethod?: 'Secret Phrase' | 'Area Restriction' | null;
  secretPhrase?: string;
  verificationMethod?: 'KYC' | 'CVC' | null;
  createdBy?: string;
  team?: string;
  allowDirectEdit?: boolean;
  participants?: string[];
  allowsOfficialPapers?: boolean;
  results?: {
    lastBlockchainSync?: string;
    blockchainVoterCount?: number;
  };
  contractAddress?: string;
  geoRestriction?: string;
  locationName?: string;
  hideFromPublic?: boolean;
  requireInvitation?: boolean;
}

export interface Election extends SessionBase {
  type: 'election';
  candidates?: Candidate[];
  maxChoices?: number;
}

export interface Poll extends SessionBase {
  type: 'poll';
  options: PollOption[];
  maxChoices?: number;
}

export interface Tournament extends SessionBase {
  type: 'tournament';
  tournamentType?: 'Round Robin' | 'Knockout' | 'Swiss' | null;
  bracket?: any;
  maxRounds?: number;
}

export type Session = Election | Poll | Tournament;

export interface CandidateApplication {
  partyName: string;
  fullName: string;
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
}

export interface VoteData {
  candidateId: string;
}

export interface SessionEditResult {
  message: string;
  editRequest?: any;
  needsApproval: boolean;
}

class SessionService {
  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const response = await baseApi.get<Session[]>('/sessions');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch sessions';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get sessions created by the current user
   */
  async getUserSessions(): Promise<Session[]> {
    try {
      const response = await baseApi.get<Session[]>('/sessions/my-sessions');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user sessions';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get sessions where current user is a team member
   */
  async getUserSessionsAsMember(): Promise<{ sessions: Session[] }> {
    try {
      const response = await baseApi.get<{ sessions: Session[] }>('/sessions/my-sessions-as-member');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch team sessions';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string, fields?: string[]): Promise<Session> {
    try {
      console.log(`Fetching session with ID ${sessionId}...`);
      let url = `/sessions/${sessionId}`;
      if (fields && fields.length > 0) {
        url += `?fields=${fields.join(',')}`;
      }
      const response = await baseApi.get<Session>(url);
      console.log(`Successfully retrieved session: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      console.error("Session fetch error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.message || `Failed to fetch session with ID ${sessionId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get session by secret phrase
   */
  async getSessionByPhrase(phrase: string): Promise<Session> {
    try {
      const response = await baseApi.get<Session>(`/sessions/by-phrase/${phrase}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid or expired secret phrase';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if a secret phrase is available
   */
  async checkSecretPhrase(phrase: string): Promise<{ available: boolean }> {
    try {
      const response = await baseApi.get<{ available: boolean }>(`/sessions/check-secret-phrase?phrase=${phrase}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to check secret phrase';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: Session): Promise<Session> {
    try {
      console.log('Sending session data to API:', JSON.stringify(sessionData, null, 2));
      const response = await baseApi.post<Session>('/sessions', sessionData);
      return response.data;
    } catch (error: any) {
      console.error('Session creation error details:', error);
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || errorResponse?.error || 'Failed to create session';
      console.error('Error response data:', errorResponse);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.delete<{ message: string }>(`/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to delete session with ID ${sessionId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Apply to be a candidate in a session
   */
  async applyAsCandidate(sessionId: string, applicationData: CandidateApplication): Promise<{ message: string; requestId: string }> {
    try {
      const response = await baseApi.post<{ message: string; requestId: string }>(
        `/sessions/${sessionId}/candidate`, 
        applicationData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit candidate application';
      throw new Error(errorMessage);
    }
  }

  /**
   * Cast a vote in a session
   */
  async castVote(sessionId: string, voteData: VoteData): Promise<{ message: string; voteId: string }> {
    try {
      const response = await baseApi.post<{ message: string; voteId: string }>(
        `/sessions/${sessionId}/vote`, 
        voteData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to cast vote';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a session
   */
  async updateSession(sessionId: string, updateData: Partial<Session>): Promise<SessionEditResult> {
    try {
      const response = await baseApi.patch<SessionEditResult>(`/sessions/${sessionId}/edit-request`, updateData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to update session`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the JWT authentication token
   * @returns The JWT token or null if not authenticated
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Get the team ID associated with a session
   * @param sessionId - The ID of the session
   * @returns Promise resolving to the team ID if found
   */
  async getSessionTeam(sessionId: string): Promise<string> {
    try {
      // First, get the session data which includes the team reference
      const session = await this.getSessionById(sessionId);
      
      // Check if the session has a team property
      if (!session.team) {
        throw new Error(`No team associated with session ${sessionId}`);
      }
      
      // Make sure we return a string (not an object)
      let teamId: string;
      
      if (typeof session.team === 'string') {
        teamId = session.team;
      } else if (session.team && typeof session.team === 'object') {
        // Define a type guard for objects with _id property
        const hasIdProperty = (obj: any): obj is { _id: string } => {
          return obj && typeof obj === 'object' && '_id' in obj && typeof obj._id === 'string';
        };
        
        // Use the type guard to safely access the _id property
        if (hasIdProperty(session.team)) {
          teamId = session.team._id;
        } else {
          // Last resort, convert to string
          teamId = String(session.team);
        }
      } else {
        throw new Error(`Team property has invalid format for session ${sessionId}`);
      }
      
      if (!teamId || typeof teamId !== 'string') {
        throw new Error(`Invalid team ID format for session ${sessionId}`);
      }
      
      // Return the team ID as a string
      return teamId;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to get team for session ${sessionId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Update session vote counts from blockchain data
   * @param sessionId - The ID of the session to update
   * @param data - Object containing vote count data
   * @returns Promise resolving to true if update was successful
   */
  async updateSessionVoteCounts(sessionId: string, data: { 
    type: string;
    voteCounts: Array<{ id: string; votes: number }>;
    voterCount: number;
    source?: string;
  }): Promise<boolean> {
    try {
      // Determine the base URL from environment or default to localhost
      const apiBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:2000';
      const apiUrl = `${apiBaseUrl}/api/sessions/${sessionId}/vote-counts`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update vote counts: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating session vote counts:', error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();
export default sessionService; 