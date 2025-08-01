'use client';

import { createContext, useContext, useState } from 'react';

import { useAuthMutations } from '../hooks/useAuthMutation';

interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    login: loginMutation,
    logout: logoutMutation,
    register: registerMutation,
  } = useAuthMutations();

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({ 
        email, 
        password,
      });
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await registerMutation.mutateAsync({ email, password });
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
