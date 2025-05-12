import baseApi from './base-api';

export interface Candidate {
  user: {
    _id: string;
    name?: string;
    email?: string;
  };
  assignedReviewer?: {
    _id: string;
    name?: string;
    email?: string;
  };
  status?: string;
  partyName: string;
  totalVotes?: number;
  requiresReview?: boolean;
  fullName: string;
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
  paper?: string;
}

export interface CandidateRequest {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  session: {
    _id: string;
    name: string;
    type: string;
  };
  fullName: string;
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
  partyName: string;
  paper?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface CandidateApplication {
  biography?: string;
  experience?: string;
  nationalities?: string[];
  dobPob?: {
    dateOfBirth: string;
    placeOfBirth: string;
  };
  promises?: string[];
  partyName: string;
  paper?: string;
}

class CandidateService {
  /**
   * Get all candidates for a session
   */
  async getCandidates(sessionId: string): Promise<Candidate[]> {
    try {
      const response = await baseApi.get<Candidate[]>(`/sessions/${sessionId}/candidates`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch candidates';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all candidate requests for a session
   */
  async getCandidateRequests(sessionId: string): Promise<CandidateRequest[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching candidate requests for session ${sessionId}...`);
      }
      const response = await baseApi.get<any[]>(`/sessions/${sessionId}/candidate/candidate-requests`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Received ${response.data.length} candidate requests`);
      }
      
      // Process and transform the response data to match our expected structure
      const transformedRequests = response.data.map((request) => {
        let userId: string = "";
        let sessionId: string = "";
        
        // Handle different potential formats for user field
        if (typeof request.user === 'string') {
          userId = request.user;
        } else if (request.user && request.user.$oid) {
          userId = request.user.$oid;
        } else if (request.user && request.user._id) {
          userId = typeof request.user._id === 'string' ? request.user._id : request.user._id.$oid || request.user._id;
        }
        
        // Handle different potential formats for session field
        if (typeof request.session === 'string') {
          sessionId = request.session;
        } else if (request.session && request.session.$oid) {
          sessionId = request.session.$oid;
        } else if (request.session && request.session._id) {
          sessionId = typeof request.session._id === 'string' ? request.session._id : request.session._id.$oid || request.session._id;
        }
        
        // Build a standardized request object
        const standardizedRequest: CandidateRequest = {
          _id: request._id || request._id.$oid || "",
          status: request.status || "pending",
          fullName: request.fullName || "",
          partyName: request.partyName || "",
          biography: request.biography,
          experience: request.experience,
          nationalities: request.nationalities,
          promises: request.promises,
          paper: request.paper,
          approvedAt: request.approvedAt,
          rejectedAt: request.rejectedAt,
          createdAt: request.requestedAt || request.createdAt,
          // Create user object with minimum required info
          user: {
            _id: userId,
            fullName: request.fullName || "Unknown User",  // Use request fullName as fallback
            email: request.email || "user@example.com"     // Placeholder if not available
          },
          // Create session object with minimum required info
          session: {
            _id: sessionId,
            name: "Current Session",                     // Default value
            type: "election"                             // Assume election since this is for candidates
          }
        };
        
        // For debugging
        if (process.env.NODE_ENV === 'development') {
          console.log("Original request:", request);
          console.log("Transformed request:", standardizedRequest);
        }
        
        return standardizedRequest;
      });
      
      return transformedRequests;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Candidate request fetch error:", error);
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      
      // If it's a 404, it likely means there are no candidate requests yet
      if (error.response?.status === 404) {
        return [];
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch candidate requests';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if user has already applied for this session
   */
  async hasUserApplied(sessionId: string): Promise<boolean> {
    try {
      const response = await baseApi.get<{ hasApplied: boolean }>(`/sessions/${sessionId}/candidate/has-applied`);
      return response.data.hasApplied;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error checking if user has applied:", error);
      }
      // Default to false on error to let the user try to apply
      return false;
    }
  }

  /**
   * Apply to be a candidate for a session
   */
  async applyAsCandidate(sessionId: string, applicationData: CandidateApplication): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/${sessionId}/candidate/apply`,
        applicationData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit candidate application';
      throw new Error(errorMessage);
    }
  }

  /**
   * Accept a candidate request
   */
  async acceptCandidateRequest(sessionId: string, requestId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/${sessionId}/candidate/accept/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error accepting candidate request:", error);
        console.error("Request details:", { sessionId, requestId });
      }
      const errorMessage = error.response?.data?.message || 'Failed to accept candidate request';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reject a candidate request
   */
  async rejectCandidateRequest(sessionId: string, requestId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/${sessionId}/candidate/reject/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error rejecting candidate request:", error);
        console.error("Request details:", { sessionId, requestId });
      }
      const errorMessage = error.response?.data?.message || 'Failed to reject candidate request';
      throw new Error(errorMessage);
    }
  }

  /**
   * Invite a user to be a candidate
   */
  async inviteCandidate(sessionId: string, userId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/${sessionId}/candidate/invite/${userId}`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send candidate invitation';
      throw new Error(errorMessage);
    }
  }
}

export const candidateService = new CandidateService();
export default candidateService; 