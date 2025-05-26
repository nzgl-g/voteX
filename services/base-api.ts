import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Determine the base URL based on environment
const getBaseUrl = () => {
  // Check if running in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:2000/votex/api';
  }
  
  // In production or when running on non-localhost in development
  if (isBrowser) {
    // Check if we're on a different domain (for testing against a remote API)
    const isDifferentDomain = process.env.NEXT_PUBLIC_API_DOMAIN;
    if (isDifferentDomain) {
      return `${isDifferentDomain}/votex/api`;
    }
  }
  
  // In production, use relative URL (assuming API is on same domain)
  return '/votex/api';
};

// Create a base axios instance for API calls
const baseApi: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to attach authorization token
baseApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Get token from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.authorization = token;
      } else if (config.url && !config.url.includes('/login') && !config.url.includes('/signup')) {
        // For endpoints that should be authenticated but we have no token,
        // add a flag to identify them for proper error handling
        config.headers = config.headers || {};
        config.headers._noAuthAvailable = true;
      }
    }
    
    // Add debugging info only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for error handling
baseApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if this was a request made with no auth token available
    const noAuthAvailable = error.config?.headers?._noAuthAvailable === true;
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Check if the response is HTML instead of JSON
      const isHtmlResponse = typeof data === 'string' && data.toString().includes('<!DOCTYPE');
      
      // Log error details in development, but ignore expected auth errors during logout
      if (process.env.NODE_ENV === 'development' && !(noAuthAvailable && status === 401)) {
        console.error('API Error:', {
          status,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          isHtmlResponse,
          data: isHtmlResponse ? 'HTML Response (not JSON)' : data,
        });
      }
      
      // Handle specific error responses
      if (status === 401) {
        // If we already know there's no auth available, don't need to handle it again
        if (!noAuthAvailable && typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Could redirect to login page if needed
          // window.location.href = '/login';
        }
      }
      
      // Create a better error message based on the response
      let errorMessage = 'An error occurred with the API request.';
      
      if (isHtmlResponse) {
        // If the response is HTML, provide a better error message
        errorMessage = 'Server error: The API endpoint might be incorrect or the server might be down.';
      } else if (typeof data === 'object' && data !== null) {
        // If the response is a JSON object, extract error message
        const errorData = data as Record<string, any>;
        if (errorData.message) {
          errorMessage = String(errorData.message);
        } else if (errorData.error) {
          errorMessage = String(errorData.error);
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Handle validation errors array if present
          errorMessage = errorData.errors.map((err: any) => err.msg || err.message || String(err)).join(', ');
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      // Create a new error with the message and additional info
      const enhancedError = new Error(errorMessage) as Error & { status?: number, data?: any };
      enhancedError.status = status;
      enhancedError.data = data;
      
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error, server didn't respond
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error: Could not connect to the server. Please check your internet connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default baseApi; 