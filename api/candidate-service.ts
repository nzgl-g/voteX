import api from '../lib/api';

// Types for Candidate API
export interface CandidateRequest {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
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
  dobPob: string;
  promises: string;
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
  dobPob: string;
  promises: string[];
  paper?: {
    name: string;
    url: string;
    uploadedAt?: string;
  }[];
}

export interface CandidateApplicationData {
  fullName: string;
  biography: string;
  experience: string;
  nationalities: string[];
  dobPob: string;
  promises: string;
  partyName: string;
  paper?: {
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
  dobPob?: string;
  promises?: string;
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
      console.log('Fetching candidates for session:', sessionId);
      
      // Updated with double slash as confirmed from Postman testing
      const response = await api.get(`/sessions/${sessionId}/candidate//candidate-requests`);
      
      // Handle HTML responses
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.warn('Received HTML response for candidates');
        return [];
      }
      
      console.log('Received candidates:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch candidates:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  },

  /**
   * Check if the current user has already applied as a candidate for a session
   * @param sessionId Session ID
   * @returns True if user has already applied, false otherwise
   */
  async hasUserApplied(sessionId: string): Promise<boolean> {
    try {
      // Get the current user from localStorage
      const userString = localStorage.getItem('user');
      if (!userString) {
        return false;
      }
      
      const user = JSON.parse(userString);
      const userId = user._id;
      
      try {
        // Check if there's an existing candidate request with double slash
        const response = await api.get(`/sessions/${sessionId}/candidate//candidate-requests`);
        
        // If data is HTML (a string that contains HTML), return false rather than throwing an error
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.warn('Received HTML response instead of JSON for candidate-requests');
          return false;
        }
        
        const requests = response.data;
        
        // Find if user has any pending or approved request
        return requests.some((request: CandidateRequest) => 
          request.user._id === userId && ['pending', 'approved'].includes(request.status));
      } catch (error) {
        console.error('Error fetching candidate requests:', error);
        // Rather than failing, we'll default to false
        return false;
      }
    } catch (error) {
      console.error('Error checking if user has applied:', error);
      return false;
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
        nationalities: candidateData.nationalities,
        dobPob: candidateData.dobPob,
        promises: candidateData.promises,
        partyName: candidateData.partyName,
        // Only include papers if they are provided
        ...(candidateData.paper && candidateData.paper.length > 0 ? { paper: candidateData.paper } : {})
      };

      console.log('Submitting candidate application for session:', sessionId);
      console.log('Candidate data:', formattedData);
      console.log('API endpoint:', `/sessions/${sessionId}/candidate/apply`);

      const response = await api.post(
        `/sessions/${sessionId}/candidate/apply`,
        formattedData
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to apply as candidate:', error);
      // More detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Check for specific error cases
        if (error.response.status === 400) {
          const errorMessage = error.response.data?.message || error.message;
          
          // Handle the case where user already has a pending application
          if (errorMessage.toLowerCase().includes('pending') || 
              errorMessage.toLowerCase().includes('already applied')) {
            throw new Error("You already have a pending application for this session.");
          }
        }
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error message:', error.message);
      }
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
      console.log('Fetching candidate requests for session:', sessionId);
      
      // Updated to use the double slash in endpoint as confirmed by Postman
      const response = await api.get(`/sessions/${sessionId}/candidate//candidate-requests`);
      
      // Handle HTML responses
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.warn('Received HTML response for candidate requests');
        return [];
      }
      
      console.log('Received candidate requests:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch candidate requests:', error);
      // Return empty array to prevent UI crashes
      return [];
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
      console.log('Accepting candidate request:', requestId, 'for session:', sessionId);
      
      // Updated to use the correct endpoint from the server implementation
      const response = await api.post(
        `/sessions/${sessionId}/candidate/accept/${requestId}`
      );
      
      console.log('Accept response:', response.data);
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
      console.log('Rejecting candidate request:', requestId, 'for session:', sessionId);
      
      // Updated to use the correct endpoint from the server implementation
      const response = await api.post(
        `/sessions/${sessionId}/candidate/reject/${requestId}`
      );
      
      console.log('Reject response:', response.data);
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
      // Updated to use the singular 'candidate' in the endpoint
      const response = await api.post(
        `/sessions/${sessionId}/candidate/invite/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to invite candidate:', error);
      throw new Error(error.response?.data?.message || 'Failed to invite candidate');
    }
  },

  /**
   * Accept a candidate invitation
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
      const formattedData = candidateData 
        ? {
            fullName: candidateData.fullName || '',
            biography: candidateData.biography || '',
            experience: candidateData.experience || '',
            nationalities: candidateData.nationalities || [],
            dobPob: candidateData.dobPob || '',
            promises: candidateData.promises || '',
            partyName: candidateData.partyName || '',
            ...(candidateData.paper ? { paper: candidateData.paper } : {})
          }
        : {};

      // Updated to use the singular 'candidate' in the endpoint
      const response = await api.post(
        `/sessions/${sessionId}/candidate/invite/${inviteId}/accept`,
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
   * @param inviteId Invitation ID
   * @returns Success message
   */
  async rejectInvitation(
    sessionId: string,
    inviteId: string
  ): Promise<{ message: string }> {
    try {
      // Updated to use the singular 'candidate' in the endpoint
      const response = await api.post(
        `/sessions/${sessionId}/candidate/invite/${inviteId}/reject`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to reject invitation:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject invitation');
    }
  },

  /**
   * Get all invitations for the current user
   * @returns Array of candidate invitations
   */
  async getMyInvitations(): Promise<CandidateInvitation[]> {
    try {
      // Updated to use the singular 'candidate' in the endpoint
      const response = await api.get('/candidate/invitations');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch invitations');
    }
  },

  /**
   * Fetch candidate requests with automatic retry
   * @param sessionId Session ID
   * @param maxRetries Maximum number of retries
   * @returns Array of candidate requests or empty array
   */
  async fetchCandidateRequestsWithRetry(
    sessionId: string, 
    maxRetries: number = 3
  ): Promise<CandidateRequest[]> {
    let retries = 0;
    let lastError: any = null;

    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1}/${maxRetries} to fetch candidate requests`);
        
        // Try the standard endpoint with double slash
        const standardEndpoint = `/sessions/${sessionId}/candidate//candidate-requests`;
        try {
          console.log('Trying standard endpoint:', standardEndpoint);
          const response = await api.get(standardEndpoint);
          
          // Check for HTML response
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.warn('Received HTML from standard endpoint, will retry');
            throw new Error('HTML response');
          }
          
          console.log('Successfully fetched candidate requests:', response.data);
          return Array.isArray(response.data) ? response.data : [];
        } catch (endpointError) {
          console.warn(`Standard endpoint failed, trying fallback`);
          
          // Try a fallback endpoint with double slash
          const fallbackEndpoint = `/sessions/${sessionId}/candidate//candidate-requests`;
          try {
            console.log('Trying fallback endpoint:', fallbackEndpoint);
            const fallbackResponse = await api.get(fallbackEndpoint);
            
            // Check for HTML response
            if (typeof fallbackResponse.data === 'string' && fallbackResponse.data.includes('<!DOCTYPE html>')) {
              throw new Error('HTML response from fallback');
            }
            
            console.log('Successfully fetched from fallback:', fallbackResponse.data);
            return Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
          } catch (fallbackError) {
            // Both attempts failed for this retry, save error and continue retrying
            lastError = endpointError;
            console.warn(`Fallback endpoint also failed, will retry`);
          }
        }
      } catch (error) {
        lastError = error;
        console.warn(`Retry ${retries + 1} failed:`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        // Wait before retrying with exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, retries - 1) * 1000;
        console.log(`Waiting ${delay}ms before retry ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error(`All ${maxRetries} attempts to fetch candidate requests failed`, lastError);
    return []; // Return empty array after all retries failed
  },
  
  /**
   * Remove a candidate from a session
   * @param sessionId Session ID
   * @param candidateId Candidate ID 
   * @returns Success message
   */
  async removeCandidate(
    sessionId: string,
    candidateId: string
  ): Promise<{ message: string }> {
    try {
      console.log('Removing candidate:', candidateId, 'from session:', sessionId);
      
      const response = await api.delete(
        `/sessions/${sessionId}/candidate/${candidateId}`
      );
      
      console.log('Remove response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to remove candidate:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove candidate');
    }
  }
}; 