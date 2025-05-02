import api from '../lib/api';

// Types for User API
export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  walletAddress?: string;
  profilePic?: string;
  createdAt: string;
}

export interface UserProfileUpdate {
  username?: string;
  fullName?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Prefer not to say';
  profilePic?: string;
}

export interface UsernameAvailability {
  available: boolean;
  message: string;
}

// User-related API methods
export const userService = {
  /**
   * Get the current user's profile
   * @returns User profile object
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch current user profile:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch user profile');
    }
  },

  /**
   * Search for users by username or email
   * @param query Search query string
   * @returns Array of matching users with current user filtered out
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      if (!query || query.trim().length < 3) {
        return []; // Return empty array for short queries
      }
      
      const response = await api.get(`/users/search?query=${encodeURIComponent(query.trim())}`);
      const users = response.data;
      
      // Get current user to filter them out of results
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser) {
        // Filter out the current user from search results
        return users.filter((user: User) => user._id !== currentUser._id);
      }
      
      return users;
    } catch (error: any) {
      console.error('Failed to search users:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Search query must be at least 3 characters');
      } else if (error.response?.status === 401) {
        throw new Error('You must be logged in to search for users');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  },

  /**
   * Check if a username is available
   * @param username Username to check
   * @returns Object with availability status and message
   */
  async checkUsernameAvailability(username: string): Promise<UsernameAvailability> {
    try {
      const response = await api.get(`/users/check-username/${encodeURIComponent(username)}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check username availability:', error);
      throw new Error(error.response?.data?.message || 'Failed to check username availability');
    }
  },

  /**
   * Update the current user's profile
   * @param userData User profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(userData: UserProfileUpdate): Promise<User> {
    try {
      const response = await api.put('/users/me', userData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user profile');
    }
  },

  /**
   * Delete the current user's account
   * @returns Success message
   */
  async deleteUserAccount(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/users/me');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete user account:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user account');
    }
  },

  /**
   * Logout the current user
   * @returns Success message
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await api.post('/users/logout');
      // Clear local storage items related to authentication
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error: any) {
      console.error('Failed to logout:', error);
      // Even if the server request fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error(error.response?.data?.message || 'Failed to logout');
    }
  },

  /**
   * Get the current user from localStorage
   * @returns User object or null if not found
   */
  getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Failed to get user from storage:', error);
      return null;
    }
  },

  /**
   * Save user to localStorage
   * @param user User object to save
   */
  saveUserToStorage(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  },

  /**
   * Check if user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
};
