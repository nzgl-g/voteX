import api from '../lib/api';

// Types for Candidate API
export interface CandidateRequest {
  _id: string;
  user: string;
  session: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  reasonForRejection: string | null;
  fullName: string;
  biography: string;
  experience: string;
  nationalities: string[];
  dobPob: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises: string[];
  partyName: string;
  papers?: {
    name: string;
    url: string;
  }[];
}

export interface Candidate {
  user: {
    _id: string;
    name?: string;
    email?: string;
  };
  assignedReviewer: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
  status: string;
  partyName: string;
  totalVotes: number;
  requiresReview: boolean;
  fullName: string;
  biography: string;
  experience: string;
  nationalities: string[];
  dobPob: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises: string[];
  papers: {
    name: string;
    url: string;
    uploadedAt?: string;
  }[];
}

export interface CandidateApplicationData {
  fullName: string;
  biography: string;
  experience: string;
  nationalities: string;
  dobPob: string;
  promises: string;
  partyName: string;
  papers?: {
    name: string;
    url: string;
  }[];
}

export interface CandidateInvitation {
  _id: string;
  sessionId: string;
  userId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  fullName?: string;
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
  partyName?: string;
}

// Candidate-related API methods
export const candidateService = {
  /**
   * Get all candidates for a session
   * @param sessionId Session ID
   * @returns Array of candidates
   */
  async getCandidates(sessionId: string): Promise<Candidate[]> {
    try {
      const response = await api.get(`/votex/api/sessions/${sessionId}/candidates`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch candidates:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch candidates');
    }
  },

  /**
   * Apply to be a candidate for a session
   * @param sessionId Session ID
   * @param candidateData Candidate application data
   * @returns Success message
   */
  async applyAsCandidate(
    sessionId: string,
    candidateData: CandidateApplicationData
  ): Promise<{ message: string }> {
    try {
      // Process the raw data to match the expected API format
      const formattedData = {
        fullName: candidateData.fullName,
        biography: candidateData.biography,
        experience: candidateData.experience,
        nationalities: candidateData.nationalities.split(',').map(n => n.trim()),
        // Convert dobPob string to the expected object format
        dobPob: {
          // If in format "Jan 1, 1990 - New York", parse it appropriately
          dateOfBirth: candidateData.dobPob.includes('-')
              ? new Date(candidateData.dobPob.split('-')[0].trim())
              : new Date(),
          placeOfBirth: candidateData.dobPob.includes('-')
              ? candidateData.dobPob.split('-')[1].trim()
              : candidateData.dobPob
        },
        promises: candidateData.promises.split('\n').filter(p => p.trim().length > 0),
        partyName: candidateData.partyName,
        // Only include papers if they are provided
        ...(candidateData.papers && candidateData.papers.length > 0 ? { papers: candidateData.papers } : {})
      };

      console.log('Submitting candidate application:', formattedData);

      const response = await api.post(
        `/votex/api/sessions/${sessionId}/candidates/apply`,
        formattedData
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to apply as candidate:', error);
      throw new Error(error.response?.data?.message || 'Failed to apply as candidate');
    }
  },

  /**
   * Get all candidate requests for a session
   * @param sessionId Session ID
   * @returns Array of candidate requests
   */
  async getCandidateRequests(sessionId: string): Promise<CandidateRequest[]> {
    try {
      // This endpoint should be created on the backend as it's missing
      const response = await api.get(`/votex/api/sessions/${sessionId}/candidate-requests`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch candidate requests:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch candidate requests');
    }
  },

  /**
   * Accept a candidate request
   * @param sessionId Session ID
   * @param requestId Request ID
   * @returns Success message
   */
  async acceptCandidateRequest(
    sessionId: string,
    requestId: string
  ): Promise<{ message: string }> {
    try {
      const response = await api.post(
        `/votex/api/sessions/${sessionId}/candidates/accept/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to accept candidate request:', error);
      throw new Error(error.response?.data?.message || 'Failed to accept candidate request');
    }
  },

  /**
   * Reject a candidate request
   * @param sessionId Session ID
   * @param requestId Request ID
   * @returns Success message
   */
  async rejectCandidateRequest(
    sessionId: string,
    requestId: string
  ): Promise<{ message: string }> {
    try {
      const response = await api.post(
        `/votex/api/sessions/${sessionId}/candidates/reject/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to reject candidate request:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject candidate request');
    }
  },

  /**
   * Invite a user to be a candidate
   * @param sessionId Session ID
   * @param userId User ID
   * @returns Success message
   */
  async inviteCandidate(
    sessionId: string,
    userId: string
  ): Promise<{ message: string }> {
    try {
      const response = await api.post(
        `/votex/api/sessions/${sessionId}/candidates/invite`,
        { userId }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to invite candidate:', error);
      throw new Error(error.response?.data?.message || 'Failed to invite candidate');
    }
  },

  /**
   * Accept a candidate invitation
   * @param sessionId Session ID
   * @param inviteId Invitation ID
   * @param candidateData Optional candidate data
   * @returns Success message
   */
  async acceptInvitation(
    sessionId: string,
    inviteId: string,
    candidateData?: Partial<CandidateApplicationData>
  ): Promise<{ message: string }> {
    try {
      // Format candidate data if provided
      let formattedData = {};
      
      if (candidateData) {
        formattedData = {
          ...(candidateData.fullName ? { fullName: candidateData.fullName } : {}),
          ...(candidateData.biography ? { biography: candidateData.biography } : {}),
          ...(candidateData.experience ? { experience: candidateData.experience } : {}),
          ...(candidateData.nationalities ? { 
            nationalities: candidateData.nationalities.split(',').map(n => n.trim())
          } : {}),
          ...(candidateData.dobPob ? {
            dobPob: {
              dateOfBirth: candidateData.dobPob.includes('-')
                ? new Date(candidateData.dobPob.split('-')[0].trim())
                : new Date(),
              placeOfBirth: candidateData.dobPob.includes('-')
                ? candidateData.dobPob.split('-')[1].trim()
                : candidateData.dobPob
            }
          } : {}),
          ...(candidateData.promises ? {
            promises: candidateData.promises.split('\n').filter(p => p.trim().length > 0)
          } : {}),
          ...(candidateData.partyName ? { partyName: candidateData.partyName } : {}),
          ...(candidateData.papers && candidateData.papers.length > 0 ? { papers: candidateData.papers } : {})
        };
      }
      
      const response = await api.post(
        `/votex/api/sessions/${sessionId}/candidates/invite/${inviteId}/accept`,
        formattedData
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      throw new Error(error.response?.data?.message || 'Failed to accept invitation');
    }
  },

  /**
   * Reject a candidate invitation
   * @param sessionId Session ID
   * @param inviteId Invitation ID
   * @returns Success message
   */
  async rejectInvitation(
    sessionId: string,
    inviteId: string
  ): Promise<{ message: string }> {
    try {
      const response = await api.post(`/votex/api/sessions/${sessionId}/candidates/invite/${inviteId}/reject`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to reject invitation:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject invitation');
    }
  },

  /**
   * Get all invitations for the current user
   * @returns Array of invitations
   */
  async getMyInvitations(): Promise<CandidateInvitation[]> {
    try {
      const response = await api.get('/votex/api/candidates/my-invitations');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch invitations');
    }
  }
}; 