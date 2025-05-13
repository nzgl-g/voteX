import baseApi from './base-api';
import blockchainService from './blockchain-service';
import { toast } from '@/lib/toast';

// Add HeadersInit type for fetch API
type HeadersInit = Headers | string[][] | Record<string, string>;

export interface SessionLifecycle {
  createdAt?: string;
  scheduledAt?: {
    start: string | null;
    end: string | null;
  };
  startedAt?: string | null;
  endedAt?: string | null;
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
  id?: string;  // Alias for user id in form
  name?: string;  // Alias for fullName in form
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
  title?: string;  // Alias for name used in form
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
  banner?: string | null;
  type: 'election' | 'poll' | 'tournament';
  subtype: 'single' | 'multiple' | 'ranked' | 'single elimination' | 'double elimination';
  accessLevel?: 'Public' | 'Private';
  visibility?: 'public' | 'private';
  resultVisibility?: 'real-time' | 'post-completion';
  subscription: Subscription;
  sessionLifecycle: SessionLifecycle;
  securityMethod?: 'Secret Phrase' | 'Area Restriction' | null;
  secretPhrase?: string | null;
  verificationMethod?: 'kyc' | 'standard' | null;
  createdBy?: string;
  team?: string;
  allowDirectEdit?: boolean;
  participants?: string[];
  allowsOfficialPapers?: boolean;
  results?: {
    lastBlockchainSync?: string;
    blockchainVoterCount?: number;
  } | null;
  contractAddress?: string | null;
  candidateRequests?: string[] | any[];
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
  paper?: string | null;
  user?: string;
}

export interface VoteData {
  candidateId: string;
  selectedOptions?: string[];
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
      console.log('Sending session data to API (structure matches Postman):', JSON.stringify(sessionData, null, 2));
      
      // Check critical fields are present
      if (!sessionData.name) console.warn('Warning: Missing name field in session data');
      if (!sessionData.type) console.warn('Warning: Missing type field in session data');
      if (!sessionData.subtype) console.warn('Warning: Missing subtype field in session data');
      if (!sessionData.subscription?.name) console.warn('Warning: Missing subscription.name in session data');
      
      const response = await baseApi.post<Session>('/sessions', sessionData);
      console.log('Session created successfully with ID:', response.data._id);
      return response.data;
    } catch (error: any) {
      console.error('Session creation error details:', error);
      let errorMessage = 'Failed to create session';
      
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response received from server';
      } else {
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      console.error('Error response data:', error.response?.data);
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
  async castVote(sessionId: string, voteData: VoteData): Promise<{ message: string; voteId: string; txHash?: string }> {
    try {
      // First, get the session to check if it has blockchain integration
      const session = await this.getSessionById(sessionId);
      
      // Check if session has blockchain integration
      if (session.contractAddress) {
        console.log(`Session ${sessionId} has blockchain integration at address ${session.contractAddress}`);
        
        // For blockchain voting, we need to get the actual candidates/options to map IDs
        const blockchainData = await this.getBlockchainDeploymentData(sessionId);

        // We need to convert the candidateId to the format expected by the blockchain
        // The blockchain expects the actual IDs stored in the participants array
        let choices: string[] = [];
        
        if (Array.isArray(voteData.selectedOptions) && voteData.selectedOptions.length > 0) {
          // Handle multiple selection
          choices = voteData.selectedOptions;
        } else {
          // Handle single selection - fall back to candidateId if selectedOptions is empty/undefined
          choices = [voteData.candidateId];
        }
        
        // Cast the vote on the blockchain only - don't record in database for anonymity
        const txHash = await blockchainService.castVote(session.contractAddress, choices);
        
        // Return success with structured data to match the expected response format
        return { 
          message: "Vote recorded successfully on blockchain", 
          voteId: `blockchain-${Date.now()}`, // Generate a unique ID that's not null
          txHash: txHash
        };
      } else {
        // Regular database voting
        const response = await baseApi.post<{ message: string; voteId: string }>(
          `/sessions/${sessionId}/vote`, 
          voteData
        );
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cast vote';
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
   * Approve a session edit request
   */
  async approveEditRequest(requestId: string): Promise<{ message: string; updatedSession: Session }> {
    try {
      const response = await baseApi.patch<{ message: string; updatedSession: Session }>(
        `/sessions/edit-requests/${requestId}/approve`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to approve edit request`;
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
        // Use type assertion to access the _id property safely
        const teamObj = session.team as { _id?: string };

        if (teamObj._id) {
          teamId = teamObj._id;
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
    type: 'candidate' | 'option';
    counts: Array<{ id: string; totalVotes: number }>;
  }): Promise<boolean> {
    try {
      // Use baseApi instead of fetch for proper authentication and error handling
      const response = await baseApi.patch(`/sessions/${sessionId}/vote-counts`, data);
      
      return response.data.success === true;
    } catch (error: any) {
      console.error('Error updating session vote counts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update vote counts';
      toast({
        title: "Failed to Update Vote Counts",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }

  /**
   * Update a session's contract address (only for authorized services)
   * @param sessionId - The ID of the session to update
   * @param contractAddress - The Ethereum contract address
   * @returns Promise resolving to the updated session
   */
  async updateContractAddress(sessionId: string, contractAddress: string): Promise<Session> {
    try {
      // Get the token from environment variable - must match server's VOTE_UPDATE_SECRET
      const authToken = process.env.NEXT_PUBLIC_VOTE_UPDATE_SECRET;
      
      // Create headers object with proper type checking
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Only add the token if it exists
      if (authToken) {
        headers['x-auth-token'] = authToken;
      }
      
      const response = await fetch(`${baseApi.defaults.baseURL}/sessions/${sessionId}/contract-address`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ contractAddress })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contract address');
      }

      const data = await response.json();
      return data.session;
    } catch (error: any) {
      console.error('Error updating contract address:', error);
      throw new Error(error.message || 'Failed to update contract address');
    }
  }

  /**
   * Get all data required for blockchain session deployment
   * @param sessionId - The ID of the session
   * @returns Promise resolving to data needed for VoteSessionFactory contract
   */
  async getBlockchainDeploymentData(sessionId: string): Promise<{
    sessionId: string;
    participants: string[];
    endTimestamp: number;
    voteMode: number;
    maxChoices: number;
  }> {
    try {
      // Use our baseApi instead of fetch to ensure consistent authentication
      const response = await baseApi.get(`/sessions/${sessionId}?fields=type,subtype,sessionLifecycle,candidates,options,maxChoices,participants`);
      const session = response.data;

      console.log('Session data retrieved:', session);

      // Convert vote mode to numeric value for contract
      // 0: Single, 1: Multiple as per VoteSession.VoteMode enum
      let voteMode = 0; // Default to Single
      if (session.subtype === 'multiple' || session.subtype === 'ranked') {
        voteMode = 1; // Multiple
      }

      // Convert end date to timestamp (seconds since epoch)
      const endDate = session.sessionLifecycle?.endedAt || session.sessionLifecycle?.scheduledAt?.end;
      const endTimestamp = endDate 
        ? Math.floor(new Date(endDate).getTime() / 1000) 
        : Math.floor(Date.now() / 1000) + 86400; // Default to 24 hours from now

      // Get candidates/options for the vote - these are the "participants" in the blockchain contract
      let participants: string[] = [];
      if (session.type === "poll" && session.options) {
        console.log('Extracting poll option IDs');
        participants = session.options.map((opt: PollOption) => {
          // Handle both ObjectId string and MongoDB document with _id
          return String(opt._id || '');
        }).filter(Boolean);
      } else if (session.type === "election" && session.candidates) {
        console.log('Extracting candidate IDs');
        participants = session.candidates.map((cand: Candidate) => {
          // Handle both ObjectId string and MongoDB document with _id
          return String(cand._id || '');
        }).filter(Boolean);
      }

      // Ensure we have valid string IDs
      participants = participants.filter(id => id && typeof id === 'string');

      if (participants.length === 0) {
        throw new Error("No participants (candidates/options) found for session");
      }

      console.log('Participants extracted:', participants);

      // Get max choices with fallback
      const maxChoices = session.maxChoices || 1;

      return {
        sessionId,
        participants,
        endTimestamp,
        voteMode,
        maxChoices
      };
    } catch (error: any) {
      console.error('Error preparing blockchain deployment data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to prepare blockchain deployment data';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if a session requires KYC verification
   * @param sessionId - The ID of the session
   * @returns Promise resolving to boolean indicating if KYC is required
   */
  async isKYCRequired(sessionId: string): Promise<boolean> {
    try {
      const response = await baseApi.get(`/sessions/${sessionId}?fields=kycRequired`);
      return response.data.kycRequired === true;
    } catch (error: any) {
      console.error('Error checking KYC requirement:', error);
      // Default to requiring KYC if there's an error
      return true;
    }
  }

  /**
   * Get user's KYC data
   * @returns Promise resolving to user KYC data
   */
  async getUserKYCData(): Promise<{
    fullName?: string;
    dateOfBirth?: string;
    nationalities?: string[];
    placeOfBirth?: string;
    isVerified?: boolean;
  }> {
    try {
      const response = await baseApi.get('/users/me/kyc');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user KYC data:', error);
      return {};
    }
  }

  /**
   * Submit KYC verification for a user
   * @param data - KYC verification data
   * @returns Promise resolving to verification result
   */
  async submitKYCVerification(data: {
    idNumber: string;
    idCardFile: File;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('idNumber', data.idNumber);
      formData.append('idCardFile', data.idCardFile);

      const response = await baseApi.post('/users/me/kyc/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        message: response.data.message || 'Verification successful',
      };
    } catch (error: any) {
      console.error('Error submitting KYC verification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed',
      };
    }
  }

  /**
   * Get vote options for a session
   * @param sessionId - The ID of the session
   * @returns Promise resolving to vote options data
   */
  async getVoteOptions(sessionId: string): Promise<{
    sessionId: string;
    type: string;
    subtype: string;
    title: string;
    description?: string;
    candidates?: Array<{
      _id: string;
      name: string;
      bio?: string;
      image?: string;
    }>;
    options?: Array<{
      _id: string;
      text: string;
      description?: string;
    }>;
    maxChoices: number;
  }> {
    try {
      // Use the existing getSessionById method instead of a new endpoint
      const session = await this.getSessionById(sessionId);
      
      // If session is not found or invalid, throw a clear error
      if (!session || !session.type) {
        throw new Error("Invalid session data");
      }
      
      let candidates: Array<{_id: string; name: string; bio?: string; image?: string}> = [];
      let options: Array<{_id: string; text: string; description?: string}> = [];
      let maxChoices = 1;
      
      // Format data based on session type
      if (session.type === 'election') {
        // Extract candidate data
        candidates = (((session as Election).candidates || []).map(candidate => ({
          _id: candidate._id || '',
          name: candidate.fullName || '',
          bio: candidate.biography || candidate.partyName || '',
          image: candidate.paper || '' // Using paper field as image if available
        })));
        maxChoices = (session as Election).maxChoices || 1;
      } else if (session.type === 'poll') {
        // Extract poll options
        options = (((session as Poll).options || []).map(option => ({
          _id: option._id || '',
          text: option.name || '',
          description: option.description || ''
        })));
        maxChoices = (session as Poll).maxChoices || 1;
      }
      
      return {
        sessionId,
        type: session.type,
        subtype: session.subtype,
        title: session.name,
        description: session.description,
        candidates,
        options,
        maxChoices
      };
    } catch (error: any) {
      console.error('Error getting vote options:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get vote options');
    }
  }

  /**
   * Get all metadata needed for voting
   * @param sessionId - The ID of the session
   * @returns Promise resolving to vote metadata
   */
  async getVoteMetadata(sessionId: string): Promise<{
    sessionId: string;
    type: string;
    subtype: string;
    candidates?: Candidate[];
    options?: PollOption[];
    maxChoices: number;
    endTime: number;
  }> {
    try {
      const session = await this.getSessionById(sessionId);
      
      // Validate session data
      if (!session || !session.type) {
        throw new Error("Invalid session data");
      }
      
      // Get end time (or default to 24 hours from now)
      const endTime = session.sessionLifecycle?.endedAt 
        ? Math.floor(new Date(session.sessionLifecycle.endedAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 86400;
      
      // Type-specific data
      let candidates: Candidate[] | undefined;
      let options: PollOption[] | undefined;
      let maxChoices = 1; // Default to 1
      
      if (session.type === 'election') {
        candidates = (session as Election).candidates;
        maxChoices = (session as Election).maxChoices || 1;
      } else if (session.type === 'poll') {
        options = (session as Poll).options;
        maxChoices = (session as Poll).maxChoices || 1;
      }
      
      return {
        sessionId,
        type: session.type,
        subtype: session.subtype,
        candidates,
        options,
        maxChoices,
        endTime
      };
    } catch (error: any) {
      console.error('Error getting vote metadata:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get vote metadata');
    }
  }
  
}

export const sessionService = new SessionService();
export default sessionService; 