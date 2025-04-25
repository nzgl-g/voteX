import axios from 'axios';

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
  async signup(username: string, email: string, password: string) {
    try {
      const response = await api.post('/signup', { username, email, password });
      
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
  }
};

export default api;
