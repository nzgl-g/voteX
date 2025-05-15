import baseApi from './base-api';

export interface Wallet {
  walletAddress?: string;
  chainId?: string;
  networkName?: string;
  balance?: string;
  signature?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  gender: string;
  profilePic?: string;
  createdAt: string;
  nationality?: string;
  dateOfBirth?: string; // Represented as string in ISO format
  wallet?: Wallet;
  walletChangeTimestamp?: string; // Represented as string in ISO format
  kycSignature?: string;
}

class UserService {
  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await baseApi.get<User>('/users/me');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await baseApi.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch user with ID ${userId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await baseApi.get<User[]>(`/users/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to search users';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await baseApi.put<User>('/users/me', profileData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }
}

export const userService = new UserService();
export default userService;
