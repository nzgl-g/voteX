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

export interface CandidateInvitation {
  _id: string;
  sessionId: string;
  userId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
}

export interface ApplicationStatus {
  exists: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  message?: string;
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
   * Check if user has an existing application for this session
   */
  async checkApplicationStatus(sessionId: string): Promise<ApplicationStatus> {
    try {
      const response = await baseApi.get<{ exists: boolean; status?: string; message?: string }>(
        `/sessions/${sessionId}/candidate/check-application`
      );
      
      return {
        exists: response.data.exists,
        status: response.data.status as 'pending' | 'approved' | 'rejected',
        message: response.data.message
      };
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error checking application status:", error);
      }
      
      // If endpoint doesn't exist yet, we'll assume no application exists
      if (error.response?.status === 404) {
        return { exists: false };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to check application status';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all candidate requests for a session
   */
  async getCandidateRequests(sessionId: string): Promise<CandidateRequest[]> {
    try {
      console.log(`[Candidate Service] Fetching candidate requests for session ${sessionId}`);
      
      // Get candidate requests from the server
      const response = await baseApi.get<any[]>(`/sessions/${sessionId}/candidate/candidate-requests`);
      
      // Log to debug what's in the response
      if (response.data && response.data.length > 0) {
        console.log(`[Candidate Service] First request email data:`, {
          directEmail: response.data[0].email,
          userEmail: response.data[0].user?.email,
          fullName: response.data[0].fullName,
          userObject: response.data[0].user
        });
      }
      
      // If there's no data, return empty array
      if (!response.data || response.data.length === 0) {
        console.log('[Candidate Service] No candidate requests found');
        return [];
      }
      
      // Generate unique IDs if missing
      let uniqueIdCounter = 1;
      
      // Process each candidate request
      const transformedRequests = response.data.map((request) => {
        // Ensure each request has a unique ID
        const requestId = request._id || 
                         (request._id?.$oid) || 
                         `temp-id-${uniqueIdCounter++}`;
                         
        // Extract user ID from request
        let userId = "";
        if (request.user) {
          if (typeof request.user === 'string') {
            userId = request.user;
          } else if (request.user.$oid) {
            userId = request.user.$oid;
          } else if (request.user._id) {
            userId = typeof request.user._id === 'string' ? 
                    request.user._id : 
                    request.user._id.$oid || String(request.user._id);
          }
        }
        
        // Create a user data object from the information we have
        // We don't try to fetch from the API since there's no /users/:id endpoint
        let userData = {
          _id: userId || `unknown-user-${uniqueIdCounter}`,
          fullName: request.fullName || "Unknown User",
          email: request.email || (request.user && typeof request.user === 'object' && request.user.email) || 
                 (request.user && typeof request.user === 'string' ? `User: ${request.user}` : "No Email Available")
        };
        
        // Extract session ID
        let sessionId = "";
        if (request.session) {
          if (typeof request.session === 'string') {
            sessionId = request.session;
          } else if (request.session.$oid) {
            sessionId = request.session.$oid;
          } else if (request.session._id) {
            sessionId = typeof request.session._id === 'string' ? 
                       request.session._id : 
                       request.session._id.$oid || String(request.session._id);
          }
        }

        // Format date of birth
        let dateOfBirth = "N/A";
        if (request.dobPob && request.dobPob.dateOfBirth) {
          // If dateOfBirth is in MongoDB date format ($date field)
          if (typeof request.dobPob.dateOfBirth === 'object' && request.dobPob.dateOfBirth.$date) {
            dateOfBirth = new Date(request.dobPob.dateOfBirth.$date).toISOString().split('T')[0];
          } else {
            // Regular date string
            try {
              dateOfBirth = new Date(request.dobPob.dateOfBirth).toISOString().split('T')[0];
            } catch (e) {
              dateOfBirth = String(request.dobPob.dateOfBirth) || "N/A";
            }
          }
        }
        
        // Ensure arrays are actually arrays
        const nationalities = Array.isArray(request.nationalities) ? 
                            request.nationalities : 
                            (request.nationalities ? [request.nationalities] : []);
                            
        const promises = Array.isArray(request.promises) ? 
                       request.promises : 
                       (request.promises ? [request.promises] : []);
        
        // Create standardized request object
        const standardizedRequest: CandidateRequest = {
          _id: requestId,
          status: request.status || "pending",
          fullName: request.fullName || userData.fullName,
          partyName: request.partyName || "",
          biography: request.biography || "",
          experience: request.experience || "",
          nationalities: nationalities,
          promises: promises,
          paper: request.paper || null,
          approvedAt: request.approvedAt,
          rejectedAt: request.rejectedAt,
          createdAt: request.requestedAt || request.createdAt,
          dobPob: {
            dateOfBirth: dateOfBirth,
            placeOfBirth: request.dobPob?.placeOfBirth || "N/A"
          },
          user: userData,
          session: {
            _id: sessionId || request.session || sessionId,
            name: request.session?.name || "Current Session",
            type: request.session?.type || "election"
          }
        };
        
        return standardizedRequest;
      });
      
      // Remove any duplicate requests (based on _id)
      const uniqueRequests = transformedRequests.filter((request, index, self) => 
        request._id && index === self.findIndex(r => r._id === request._id)
      );
      
      return uniqueRequests;
    } catch (error: any) {
      console.error("[Candidate Service] Candidate request fetch error:", error);
      
      // If it's a 404, it likely means there are no candidate requests yet
      if (error.response?.status === 404) {
        return [];
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch candidate requests';
      throw new Error(errorMessage);
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
  
  /**
   * Accept a candidate invitation
   */
  async acceptCandidateInvitation(inviteId: string, candidateData: CandidateApplication): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/candidate/invite/${inviteId}/accept`,
        candidateData
      );
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error accepting candidate invitation:", error);
      }
      const errorMessage = error.response?.data?.message || 'Failed to accept candidate invitation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reject a candidate invitation
   */
  async rejectCandidateInvitation(inviteId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.post<{ message: string }>(
        `/sessions/candidate/invite/${inviteId}/reject`
      );
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error rejecting candidate invitation:", error);
      }
      const errorMessage = error.response?.data?.message || 'Failed to reject candidate invitation';
      throw new Error(errorMessage);
    }
  }
}

export const candidateService = new CandidateService();
export default candidateService; 