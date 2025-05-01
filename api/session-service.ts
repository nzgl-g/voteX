import api from "../lib/api";

// Types for Session API
export interface SessionParticipant {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  role: 'team_leader' | 'team_member' | 'candidate' | 'voter';
}

export interface SessionTeam {
  _id: string;
  sessionName: string;
  leader: string;
  members: string[];
}

export interface SessionCandidate {
  user: string;
  status: 'Verified' | 'Pending' | 'Refused';
  assignedReviewer: string | null;
  partyName: string;
  totalVotes: number;
  requiresReview: boolean;
}

export interface SessionOption {
  name: string;
  description: string | null;
  totalVotes: number;
}

export interface Session {
  _id: string;
  name: string;
  description: string | null;
  organizationName: string | null;
  banner: string | null;
  type: 'election' | 'poll' | 'tournament';
  subtype: 'single' | 'multiple' | 'ranked' | 'single elimination' | 'double elimination';
  accessLevel: 'Public' | 'Private';
  subscription: {
    name: 'free' | 'pro' | 'enterprise';
    price: number;
    voterLimit: number | null;
    features: string[];
    isRecommended: boolean;
  };
  sessionLifecycle: {
    createdAt: string;
    scheduledAt: {
      start: string | null;
      end: string | null;
    };
    startedAt: string | null;
    endedAt: string | null;
  };
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  team: SessionTeam;
  results: any | null;
  securityMethod: 'Secret Phrase' | 'Area Restriction' | null;
  secretPhrase?: string;
  verificationMethod: 'KYC' | 'CVC' | null;
  candidateRequests: string[];
  participants: string[] | SessionParticipant[];
  // Election specific fields
  candidates?: SessionCandidate[];
  // Poll specific fields
  options?: SessionOption[];
  // Tournament specific fields
  tournamentType?: 'Round Robin' | 'Knockout' | 'Swiss' | null;
  bracket?: any;
  maxRounds?: number;
}

export interface CreateSessionParams {
  name: string;
  description?: string;
  organizationName?: string;
  banner?: string;
  type: 'election' | 'poll' | 'tournament';
  subtype: 'single' | 'multiple' | 'ranked' | 'single elimination' | 'double elimination';
  subscription: {
    name: 'free' | 'pro' | 'enterprise';
    price: number;
    voterLimit?: number;
    features: string[];
    isRecommended?: boolean;
  };
  sessionLifecycle?: {
    scheduledAt?: {
      start?: string;
      end?: string;
    };
  };
  securityMethod?: 'Secret Phrase' | 'Area Restriction';
  accessLevel: 'Public' | 'Private';
  secretPhrase?: string;
  verificationMethod?: 'KYC' | 'CVC';
  candidates?: string[];
  options?: {
    name: string;
    description?: string;
  }[];
  tournamentType?: 'Round Robin' | 'Knockout' | 'Swiss';
  bracket?: any;
  maxRounds?: number;
}

// Session-related API methods
export const sessionService = {
  /**
   * Get all sessions
   * @returns Array of all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const response = await api.get("/sessions");
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch all sessions:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch all sessions");
    }
  },
  
  /**
   * Get the current user's ID from localStorage
   * @returns User ID string or null if not found
   */
  getCurrentUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData._id || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to get current user ID:", error);
      return null;
    }
  },

  /**
   * Check if user has any sessions
   * @returns Boolean indicating if user has sessions
   */
  async hasUserSessions(): Promise<boolean> {
    try {
      const response = await api.get("/sessions/my-sessions");
      return response.data && Array.isArray(response.data) && response.data.length > 0;
    } catch (error: any) {
      console.error("Failed to check user sessions:", error);
      return false;
    }
  },

  /**
   * Get all sessions created by the current user
   * @returns Array of user's sessions
   */
  async getUserSessions(): Promise<Session[]> {
    try {
      const response = await api.get("/sessions/my-sessions");
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch user sessions:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch user sessions");
    }
  },

  /**
   * Get all sessions where the current user is a team member
   * @returns Object containing array of sessions
   */
  async getUserSessionsAsMember(): Promise<{ sessions: Session[] }> {
    try {
      const response = await api.get("/sessions/my-sessions-as-member");
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch user sessions as member:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch user sessions as member");
    }
  },

  /**
   * Check if a secret phrase is available (not already used)
   * @param phrase The secret phrase to check
   * @returns Object indicating if the phrase is available
   */
  async checkSecretPhraseAvailability(phrase: string): Promise<{ available: boolean }> {
    try {
      const response = await api.get(`/sessions/check-secret-phrase?phrase=${encodeURIComponent(phrase)}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to check secret phrase availability:", error);
      throw new Error(error.response?.data?.message || "Failed to check secret phrase availability");
    }
  },

  /**
   * Get a session by its secret phrase
   * @param phrase The secret phrase of the session
   * @returns Session object
   */
  async getSessionByPhrase(phrase: string): Promise<Session> {
    try {
      const response = await api.get(`/sessions/by-phrase/${encodeURIComponent(phrase)}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch session by phrase:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch session by phrase");
    }
  },

  /**
   * Get a session by its ID
   * @param sessionId The ID of the session
   * @param fields Optional comma-separated list of fields to return
   * @returns Session object or selected fields
   */
  async getSessionById(sessionId: string, fields?: string): Promise<Session | Partial<Session>> {
    try {
      const url = fields 
        ? `/sessions/${sessionId}?fields=${encodeURIComponent(fields)}`
        : `/sessions/${sessionId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch session with ID ${sessionId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch session");
    }
  },

  /**
   * Delete a session
   * @param sessionId The ID of the session to delete
   * @returns Success message
   */
  async deleteSession(sessionId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to delete session with ID ${sessionId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to delete session");
    }
  },

  /**
   * Create a new session
   * @param sessionData Data for the new session
   * @returns Created session object
   */
  async createSession(sessionData: CreateSessionParams): Promise<Session> {
    try {
      const response = await api.post("/sessions", sessionData);
      return response.data;
    } catch (error: any) {
      console.error("Failed to create session:", error);
      throw new Error(error.response?.data?.message || "Failed to create session");
    }
  },

  /**
   * Get the team associated with a session
   * @param sessionId The ID of the session
   * @returns Team ID
   */
  async getSessionTeam(sessionId: string): Promise<string> {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.team?._id;
    } catch (error: any) {
      console.error(`Failed to get team for session with ID ${sessionId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to get session team");
    }
  },

  /**
   * Get the members of a session team
   * @param teamId The ID of the team
   * @returns Array of team members
   */
  async getSessionTeamMembers(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get members for team with ID ${teamId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to get team members");
    }
  },
  
  /**
   * Join a session using a secret phrase
   * @param phrase The secret phrase of the session
   * @returns Session object that was joined
   */
  async joinSessionWithPhrase(phrase: string): Promise<Session> {
    try {
      // First get the session by phrase
      const session = await this.getSessionByPhrase(phrase);
      
      // Then join as a participant (this would need to be implemented on the backend)
      // For now, we'll just return the session
      return session;
    } catch (error: any) {
      console.error("Failed to join session with phrase:", error);
      throw new Error(error.response?.data?.message || "Failed to join session with phrase");
    }
  }
};