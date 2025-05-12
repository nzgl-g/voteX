import axios from 'axios';
import { AxiosError } from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:2000/votex/api', // Server routes are prefixed with /votex/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Enhanced error logging
    if (error.response) {
      const responseData = error.response.data;
      // Check if the response is HTML instead of JSON
      const isHtmlResponse = typeof responseData === 'string' && responseData.includes('<!DOCTYPE');
      
      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        // Log request details to help with debugging
        console.error('API Request Details:', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          data: error.config?.data ? JSON.parse(error.config.data) : null,
          headers: error.config?.headers
        });
      }
      
      // Handle empty response data
      if (!responseData || Object.keys(responseData).length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error Response: Empty response data', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url
          });
        }
        
        // Add a default message based on status code
        if (error.response.status === 500) {
          error.response.data = { message: "Internal server error" };
        } else if (error.response.status === 404) {
          // Check if this is a session request (URL contains 'sessions')
          if (error.config?.url?.includes('/sessions/')) {
            error.response.data = { message: "Session not found", notFound: true };
          } else {
            error.response.data = { message: "Resource not found" };
          }
        } else if (error.response.status === 403) {
          error.response.data = { message: "Not authorized to perform this action" };
        } else if (error.response.status === 400) {
          error.response.data = { message: "Bad request - invalid data provided" };
        } else {
          error.response.data = { message: `Error: ${error.response.statusText}` };
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error Response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            isHtmlResponse,
            data: isHtmlResponse ? 'HTML Response (not JSON)' : error.response.data,
            url: error.config?.url
          });
        }
        
        // Add 'notFound' property for 404 responses to make them easier to detect
        if (error.response.status === 404 && error.config?.url?.includes('/sessions/')) {
          if (typeof error.response.data === 'object' && error.response.data !== null) {
            (error.response.data as any).notFound = true;
          }
        }
      }
      
      // If we got HTML instead of JSON, provide a more helpful error
      if (isHtmlResponse) {
        return Promise.reject(new Error('Server returned HTML instead of JSON. The API endpoint might be incorrect or the server might be down.'));
      }
    } else if (error.request) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error Request:', error.request);
      }
      return Promise.reject(new Error('Network error: Could not connect to the server. Please check your internet connection.'));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', error.message);
      }
    }
    return Promise.reject(error);
  }
);

// Session API methods
export const sessionApi = {
  // Get user's sessions
  async getUserSessions() {
    try {
      const response = await api.get('/sessions/my-sessions');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch user sessions');
      }
      throw error;
    }
  },
};

// Auth API methods
export const authApi = {
  // Helper method to set cookies
  _setCookie(name: string, value: string, days: number = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },

  // Helper method to delete cookies
  _deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  },

  // Login method
  async login(email: string, password: string) {
    try {
      const response = await api.post('/login', { email, password });
      
      if (response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also store token and user data in cookies for middleware access
        this._setCookie('token', response.data.token);
        this._setCookie('user', JSON.stringify(response.data.user));
        
        return response.data;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Authentication failed');
      }
      throw error;
    }
  },

  // Signup method
  async signup(
    username: string, 
    email: string, 
    password: string, 
    gender: string,
    fullName?: string
  ) {
    try {
      const response = await api.post('/signup', { 
        username, 
        email, 
        password, 
        gender,
        fullName
      });
      
      if (response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also store token and user data in cookies for middleware access
        this._setCookie('token', response.data.token);
        this._setCookie('user', JSON.stringify(response.data.user));
        
        return response.data;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw error;
    }
  },

  // Logout method
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Also remove the token and user cookies
    this._deleteCookie('token');
    this._deleteCookie('user');
  },

  // Check if user is authenticated
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  // Get current user
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Fetch user profile from server
  async fetchUserProfile() {
    try {
      const response = await api.get('/users/me');
      if (response.data) {
        // Map backend fields to frontend expectations
        const user = response.data;
        const mappedUser = {
          name: user.fullName || user.name || user.username || "User",
          email: user.email,
          avatar: user.profilePic || user.avatar || undefined,
          role: user.role || 'voter', // Ensure role is included
          ...user // keep all other fields for settings, etc.
        };
        localStorage.setItem('user', JSON.stringify(mappedUser));
        
        // Also store user data in cookies for middleware access
        this._setCookie('user', JSON.stringify(mappedUser));
        
        return mappedUser;
      }
      throw new Error('Failed to fetch user profile');
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch user profile');
      }
      throw error;
    }
  },

  // Check username availability
  async checkUsernameAvailability(username: string) {
    try {
      const response = await api.get(`/users/check-username/${username}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to check username availability');
      }
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userData: {
    username?: string;
    fullName?: string;
    email?: string;
    gender?: string;
    profilePic?: string;
  }) {
    try {
      const response = await api.put('/users/me', userData);
      
      if (response.data) {
        // Update the user data in localStorage with the response from server
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Also update the user data in cookies
        this._setCookie('user', JSON.stringify(response.data));
        
        return response.data;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update profile');
      }
      throw error;
    }
  }
};

export default api;
