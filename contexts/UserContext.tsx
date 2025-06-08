import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../app/auth/AuthProvider';

interface UserContextType {
  user: any | null;
  isLoading: boolean;
  getCurrentUserId: () => string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, isLoading } = useAuth();

  const getCurrentUserId = () => {
    return user?.id || null;
  };

  const value: UserContextType = {
    user,
    isLoading,
    getCurrentUserId,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 