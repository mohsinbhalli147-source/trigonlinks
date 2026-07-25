import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface AuthUser {
  uid: string;
  email: string;
  role?: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  customerLogin: (username: string, cnic: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing tokens on mount
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('Email aur password required hain.');
    }

    try {
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;

        // Store tokens
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

        // Update user state immediately
        setUser(userData);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.error || error.message || 'Login failed. Please try again.');
    }
  };

  const customerLogin = async (username: string, cnic: string) => {
    if (!username.trim() || !cnic.trim()) {
      throw new Error('Username and CNIC are required.');
    }

    try {
      const response = await authApi.customerLogin(username, cnic);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        
        // Store tokens
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        
        setUser(userData);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Customer Login error:', error);
      throw new Error(error.error || error.message || 'Invalid Username or CNIC');
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, customerLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
