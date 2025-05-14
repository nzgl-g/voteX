import baseApi from "./base-api";

interface KYCData {
  fullName?: string;
  dateOfBirth?: string;
  nationalities?: string[];
  placeOfBirth?: string;
  isVerified?: boolean;
}

interface KYCVerificationRequest {
  idNumber: string;
  idCardFile: File;
}

interface KYCVerificationResponse {
  success: boolean;
  message: string;
}

class KYCService {
  /**
   * Get the current user's KYC data
   * @returns Promise resolving to KYC data
   */
  async getUserKYCData(): Promise<KYCData> {
    try {
      const response = await baseApi.get('/users/me/kyc');
      return response.data;
    } catch (error: any) {
      console.error('Error getting KYC data:', error);
      return {};
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