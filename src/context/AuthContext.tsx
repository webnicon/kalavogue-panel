import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.js';
import { AdminUser } from '../types.js';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('woo_admin_token');
      const storedUser = localStorage.getItem('woo_admin_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify with server on bootup
          const response = await apiService.getCurrentUser();
          setUser(response.data.user);
          localStorage.setItem('woo_admin_user', JSON.stringify(response.data.user));
        } catch (err) {
          console.error('Failed to validate active session on start:', err);
          // Token is invalid/expired
          localStorage.removeItem('woo_admin_token');
          localStorage.removeItem('woo_admin_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.login({ username, password });
      const { token, user: loggedUser } = res.data;
      
      localStorage.setItem('woo_admin_token', token);
      localStorage.setItem('woo_admin_user', JSON.stringify(loggedUser));
      
      setToken(token);
      setUser(loggedUser);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Authentication error details:', err);
      const msg = err.response?.data?.error || 'Invalid credentials or connection timeout';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      console.warn('Silent logout request failed:', e);
    }
    localStorage.removeItem('woo_admin_token');
    localStorage.removeItem('woo_admin_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be called inside an AuthProvider wrapper');
  }
  return context;
};
