// API client for authentication and other server requests
import axios from 'axios';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:2000/votex/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication API methods
export const authApi = {
  // Login with email and password
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      // Store the token from header
      const token = response.headers.authorization;
      if (token) {
        localStorage.setItem('auth_token', token);
        // Set token for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Sign up with username, email, and password
  signup: async (username: string, email: string, password: string, role: 'admin' | 'team_leader' | 'team_member' | 'candidate' | 'voter' = 'voter') => {
    try {
      if (!['admin', 'team_leader', 'team_member', 'candidate', 'voter'].includes(role)) {
        throw new Error('Invalid role specified');
      }
      const response = await apiClient.post('/signup', { 
        username, 
        email, 
        password,
        role
      });
      // Store the token from header
      const token = response.headers.authorization;
      if (token) {
        localStorage.setItem('auth_token', token);
        // Set token for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return response;
    } catch (error: any) {
      console.error('Signup error:', error);
      // Check if the error response contains HTML (indicating a server error)
      if (error.response?.data instanceof Document || 
          (typeof error.response?.data === 'string' && error.response.data.includes('<!DOCTYPE'))) {
        console.error('Server returned HTML:', error.response.data);
        throw new Error('Server error occurred. Please try again later.');
      }
      // If it's a regular API error with JSON response, throw that
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // For network or other errors
      throw new Error('Failed to sign up. Please check your connection and try again.');
    }
  },

  // Logout - clear token
  logout: () => {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user's token
  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  // Initialize auth state from localStorage on app load
  initAuth: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  }
};

// Set up interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      authApi.logout();
      // Redirect to login page if needed
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Initialize auth on import
authApi.initAuth();

export default apiClient;