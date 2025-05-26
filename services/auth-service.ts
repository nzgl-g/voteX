import baseApi from './base-api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  gender: string;
  fullName?: string;
  nationality: string;
  dateOfBirth: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  gender: string;
  profilePic?: string;
  createdAt: string;
  wallet?: {
    walletAddress: string;
    chainId: string;
    networkName: string;
    balance: string;
  };
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface WalletLinkData {
  walletAddress: string;
  chainId: string;
  networkName: string;
  balance: string;
  signature: string;
  message: string;
}

export interface ProfileUpdateData {
  username?: string;
  fullName?: string;
  email?: string;
  gender?: string;
  profilePic?: string;
}

class AuthService {
  // Helper method to set cookies
  private setCookie(name: string, value: string, days: number = 7): void {
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }

  // Helper method to delete cookies
  private deleteCookie(name: string): void {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  }

  /**
   * Login a user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await baseApi.post<AuthResponse>('/login', credentials);
      
      if (response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also store token and user data in cookies for middleware access
        this.setCookie('token', response.data.token);
        this.setCookie('user', JSON.stringify(response.data.user));
        
        return response.data;
      } else {
        throw new Error('Authentication failed: No token received');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Register a new user
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await baseApi.post<AuthResponse>('/signup', userData);
      
      if (response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also store token and user data in cookies for middleware access
        this.setCookie('token', response.data.token);
        this.setCookie('user', JSON.stringify(response.data.user));
        
        return response.data;
      } else {
        throw new Error('Registration failed: No token received');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Log out the current user
   */
  logout(): void {
    // First remove auth data to prevent further authenticated requests
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove private session data
    localStorage.removeItem('accessedSecretSessions');
    localStorage.removeItem('redirectAfterLogin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    // Remove cookies
    this.deleteCookie('token');
    this.deleteCookie('user');
    
    // Call the logout endpoint without requiring authentication
    // We don't need to wait for the response or handle errors 
    // since we're already logged out on the client side
    fetch(`${baseApi.defaults.baseURL}/users/logout`, {
      method: 'POST',
    }).catch(() => {
      // Silently fail - we're already logged out on the client
    });
  }

  /**
   * Check if a user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }

  /**
   * Get the current user from local storage
   */
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Fetch current user profile from server
   */
  async fetchUserProfile(): Promise<UserProfile> {
    try {
      const response = await baseApi.get<UserProfile>('/users/me');
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      this.setCookie('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
    try {
      const response = await baseApi.get(`/users/check-username/${username}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to check username availability';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await baseApi.put<UserProfile>('/users/me', userData);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      this.setCookie('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Link blockchain wallet to user account
   */
  async linkWallet(walletData: WalletLinkData): Promise<{ message: string; wallet: any }> {
    try {
      const response = await baseApi.put('/users/link-wallet', walletData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to link wallet';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify wallet status
   */
  async verifyWallet(): Promise<{ isLinked: boolean; wallet: any; canChangeWallet: boolean }> {
    try {
      const response = await baseApi.get('/users/verify-wallet');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify wallet';
      throw new Error(errorMessage);
    }
  }
}

export const authService = new AuthService();
export default authService; 