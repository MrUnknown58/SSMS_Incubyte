import React, { createContext, useState, useEffect, type ReactNode } from 'react';

import type { AuthResponse } from '../types';

import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (email: string, password: string, name: string, isAdmin?: boolean) => Promise<void>;

  logout: () => void;
}

// Create context - this will be imported by the hook

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app startup

    const token = localStorage.getItem('auth_token');

    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;

        setUser(parsedUser);
      } catch {
        // Clear invalid data

        localStorage.removeItem('auth_token');

        localStorage.removeItem('user_data');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response: AuthResponse = await api.login({ email, password });

    setUser(response.user);

    localStorage.setItem('user_data', JSON.stringify(response.user));
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    isAdmin: boolean = false
  ): Promise<void> => {
    const response: AuthResponse = await api.register({ email, password, name, isAdmin });

    setUser(response.user);

    localStorage.setItem('user_data', JSON.stringify(response.user));
  };

  const logout = (): void => {
    api.logout();

    setUser(null);

    localStorage.removeItem('user_data');
  };

  const value: AuthContextType = {
    user,

    isLoading,

    isAuthenticated: !!user,

    login,

    register,

    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export context for the hook

export { AuthContext };

export type { AuthContextType, User };
