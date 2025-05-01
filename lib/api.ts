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
      
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        isHtmlResponse,
        data: isHtmlResponse ? 'HTML Response (not JSON)' : error.response.data,
        url: error.config?.url
      });
      
      // If we got HTML instead of JSON, provide a more helpful error
      if (isHtmlResponse) {
        return Promise.reject(new Error('Server returned HTML instead of JSON. The API endpoint might be incorrect or the server might be down.'));
      }
    } else if (error.request) {
      console.error('API Error Request:', error.request);
    } else {
      console.error('API Error:', error.message);
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
  // Login method
  async login(email: string, password: string) {
    try {
      const response = await api.post('/login', { email, password });
      
      if (response.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user
  getCurrentUser() {
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
          ...user // keep all other fields for settings, etc.
        };
        localStorage.setItem('user', JSON.stringify(mappedUser));
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
