'use client';

import { User } from '@supabase/supabase-js';
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  accessToken,
  user
}: {
  children: ReactNode;
  accessToken: string;
  user: User;
}) {
  return (
    <AuthContext.Provider value={{ accessToken, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 