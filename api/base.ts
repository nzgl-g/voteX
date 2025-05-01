import axios from 'axios';

// Base API configuration
export const api = axios.create({
  baseURL: 'http://localhost:2000/votex/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;