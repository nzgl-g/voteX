import baseApi from "./base-api";

interface KYCData {
  fullName?: string;
  dateOfBirth?: string;
  nationalities?: string[];
  placeOfBirth?: string;
  isVerified?: boolean;
}

// New interface for the /kyc/status endpoint response
export interface KYCStatus {
  isVerified: boolean;
  message?: string; // Optional message from the status endpoint
  debug?: {
    userId?: string;
    hasKycSignature?: boolean;
    time?: string;
    [key: string]: any; // Allow for other debug properties
  };
}

interface KYCVerificationRequest {
  idNumber: string;
  idCardFile: File;
}

interface KYCVerificationResponse {
  success: boolean;
  message: string;
  verificationDetails?: {
    decision?: string;
    reason?: string;
    checks?: any;
    detailedResults?: any;
  };
}

class KYCService {
  /**
   * Get the current user's KYC data
   * @returns Promise resolving to KYC data
   */
  async getUserKYCData(): Promise<KYCData> {
    try {
      const response = await baseApi.get('/users/me/kyc');
      return { isVerified: false, ...response.data };
    } catch (error: any) {
      console.error('Error getting KYC data:', error);
      return {
        fullName: undefined,
        dateOfBirth: undefined,
        nationalities: undefined,
        placeOfBirth: undefined,
        isVerified: false
      };
    }
  }

  /**
   * Get the current user's KYC verification status from /kyc/status
   * @returns Promise resolving to KYC status
   */
  async getUserKYCStatus(): Promise<KYCStatus> {
    try {
      console.log('Fetching KYC status from /kyc/status endpoint');
      const response = await baseApi.get<KYCStatus>('/kyc/status');
      console.log('KYC status response:', response.data);
      
      // Extract relevant fields from the response
      const { isVerified, message, debug } = response.data;
      
      return {
        isVerified: !!isVerified, // Ensure boolean
        message: message || (isVerified ? "User is verified" : "User is not verified")
      };
    } catch (error: any) {
      console.error('Error getting KYC status from /kyc/status:', error);
      
      // If there's response data, try to extract from it
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
      
      // Return a default status object indicating not verified
      return {
        isVerified: false,
        message: error.message || "Could not retrieve KYC status from /kyc/status",
      };
    }
  }

  /**
   * Submit KYC verification for the current user
   * @param data - KYC verification data
   * @returns Promise resolving to verification response
   */
  async submitVerification(data: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    try {
      const formData = new FormData();
      formData.append('idNumber', data.idNumber);
      formData.append('idCardFile', data.idCardFile);

      console.log('Submitting KYC verification form data...', {
        idNumber: data.idNumber,
        idCardFile: `${data.idCardFile.name} (${Math.round(data.idCardFile.size / 1024)} KB)`
      });

      // The endpoint is now /kyc/verify (no users/me prefix) since our server routes are configured that way
      const response = await baseApi.post('/kyc/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000000, // Greatly increased timeout to prevent timeouts
      });

      console.log('KYC verification response:', response.data);

      // Extract verification details from the response
      const verificationDetails = response.data.verificationDetails || {};

      return {
        success: response.data.success,
        message: response.data.message || 'Verification process completed',
        verificationDetails: {
          decision: verificationDetails.decision || response.data.decision,
          reason: verificationDetails.reason || response.data.reason,
          checks: verificationDetails.checks || response.data.checks,
          detailedResults: response.data.detailedResults
        }
      };
    } catch (error: any) {
      console.error('Error submitting KYC verification:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received for request:', error.request);
      } else {
        console.error('Error details:', error.message);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Verification failed',
      };
    }
  }

  /**
   * Check if a session requires KYC verification
   * @param sessionId - The ID of the session
   * @returns Promise resolving to boolean indicating if KYC is required
   */
  async isKYCRequiredForSession(sessionId: string): Promise<boolean> {
    try {
      const response = await baseApi.get(`/sessions/${sessionId}?fields=verificationMethod`);
      
      // Check if verification method is set to 'kyc' (case insensitive)
      const verificationMethod = response.data.verificationMethod;
      return verificationMethod ? 
        verificationMethod.toLowerCase() === 'kyc' : 
        false;
    } catch (error: any) {
      console.error('Error checking KYC requirement:', error);
      // Default to not requiring KYC if there's an error
      return false;
    }
  }
}

export const kycService = new KYCService();
export default kycService; 