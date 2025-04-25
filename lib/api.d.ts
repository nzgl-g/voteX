declare module '@/lib/api' {
  export const authApi: {
    login: (email: string, password: string) => Promise<any>;
    signup: (username: string, email: string, password: string) => Promise<any>;
    logout: () => void;
    isAuthenticated: () => boolean;
    getCurrentUser: () => any;
  };
  
  const api: any;
  export default api;
}
