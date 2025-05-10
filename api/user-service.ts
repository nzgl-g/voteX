import api from '../lib/api';
import { formatEther } from 'ethers';

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
  wallet?: {
    walletAddress: string;
    chainId: string;
    networkName: string;
    balance: string;
    signature: string;
  };
  walletChangeTimestamp?: string;
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

export interface WalletInfo {
  isLinked: boolean;
  wallet: {
    walletAddress: string;
    chainId: string;
    networkName: string;
    balance: string;
    signature: string;
  } | null;
  canChangeWallet: boolean;
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
      if (typeof window === 'undefined') return null;
      
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
      if (typeof window === 'undefined') return;
      
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
    if (typeof window === 'undefined') return false;
    
    return !!localStorage.getItem('token');
  },

  /**
   * Connect to MetaMask wallet
   * @returns Wallet connection data
   */
  async connectMetaMask(): Promise<{
    walletAddress: string;
    chainId: string;
    networkName: string;
    balance: string;
    signature: string;
    message: string;
  }> {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      console.log('=== META MASK CONNECTION START ===');
      console.log('Requesting accounts with params:', { method: 'eth_requestAccounts' });
      
      // Step 1: Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('MetaMask returned accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      console.log('Selected account address:', address);

      // Step 2: Get network info
      console.log('Requesting chain ID...');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Chain ID received:', chainId);
      
      const networkName = chainId === '0x1' ? 'Ethereum Mainnet' : 
                         chainId === '0x89' ? 'Polygon Mainnet' : 
                         chainId === '0x13881' ? 'Mumbai Testnet' : 'Unknown Network';
      
      console.log('Network name determined:', networkName);

      // Step 3: Get balance
      console.log('Requesting balance for address:', address);
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      console.log('Raw balance received:', balance);

      const formattedBalance = formatEther(balance);
      console.log('Formatted balance:', formattedBalance);

      // Step 4: Create and sign message
      const message = `Connect wallet to Vote System\nAddress: ${address}\nNetwork: ${networkName}\nTimestamp: ${Date.now()}`;
      console.log('Message to sign:', message);
      
      console.log('Requesting signature with params:', {
        method: 'personal_sign',
        params: [message, address]
      });
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });
      console.log('Signature received:', signature);

      // Prepare final wallet data
      const walletData = {
        walletAddress: address,
        chainId,
        networkName,
        balance: formattedBalance,
        signature,
        message
      };
      console.log('=== FINAL WALLET DATA ===', walletData);

      return walletData;
    } catch (error: any) {
      console.error('=== META MASK ERROR ===', {
        code: error.code,
        message: error.message,
        data: error.data,
        stack: error.stack
      });
      if (error.code === 4001) {
        throw new Error('User denied wallet connection');
      }
      throw new Error(error.message || 'Failed to connect to MetaMask');
    }
  },

  /**
   * Link wallet to user account
   * @param walletData Wallet connection data
   * @returns Updated wallet information
   */
  async linkWallet(walletData: {
    walletAddress: string;
    chainId: string;
    networkName: string;
    balance: string;
    signature: string;
    message: string;
  }): Promise<{ message: string; wallet: User['wallet'] }> {
    console.log('=== LINKING WALLET TO USER ===');
    try {
      console.log('1. Sending wallet data to server:', walletData);
      const response = await api.put('/users/link-wallet', walletData);
      console.log('2. Server response:', response.data);
      
      // Update local storage with new wallet info
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser) {
        currentUser.wallet = response.data.wallet;
        currentUser.walletAddress = walletData.walletAddress;
        this.saveUserToStorage(currentUser);
        console.log('3. Updated local storage:', currentUser);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('=== WALLET LINKING ERROR ===', error);
      throw new Error(error.response?.data?.message || 'Failed to link wallet');
    }
  },

  /**
   * Verify wallet connection status
   * @returns Wallet connection information
   */
  async verifyWallet(): Promise<WalletInfo> {
    console.log('=== VERIFYING WALLET CONNECTION ===');
    try {
      console.log('1. Sending verify request to server...');
      const response = await api.get('/users/verify-wallet');
      console.log('2. Server response:', response.data);
      
      // Check if wallet is actually connected (has valid data)
      const isWalletConnected = response.data.wallet && 
        response.data.wallet.walletAddress && 
        response.data.wallet.chainId && 
        response.data.wallet.networkName && 
        response.data.wallet.balance;
      
      console.log('3. Is wallet connected:', isWalletConnected);
      console.log('4. Wallet data:', response.data.wallet);

      // Update local storage if wallet info is different
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser && response.data.wallet) {
        if (currentUser.wallet?.walletAddress !== response.data.wallet.walletAddress) {
          currentUser.wallet = response.data.wallet;
          currentUser.walletAddress = response.data.wallet.walletAddress;
          this.saveUserToStorage(currentUser);
          console.log('5. Updated local storage with new wallet:', currentUser);
        }
      }
      
      return {
        ...response.data,
        isLinked: isWalletConnected
      };
    } catch (error: any) {
      console.error('=== WALLET VERIFICATION ERROR ===', error);
      throw new Error(error.response?.data?.message || 'Failed to verify wallet connection');
    }
  }
};
