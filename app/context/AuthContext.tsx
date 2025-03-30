import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

// Tipul pentru contextul de autentificare
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean | null;
  userId: string | null;
  username: string | null;
  errorMessage: string | null;
  isOnlineMode: boolean;
  signInAnonymously: (username: string, offlineMode: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
}

// Creăm contextul cu valori implicite
export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isAuthenticated: null,
  userId: null,
  username: null,
  errorMessage: null,
  isOnlineMode: false,
  signInAnonymously: async () => false,
  signOut: async () => {},
  updateUsername: async () => false,
});

// Props pentru provider
interface AuthProviderProps {
  children: ReactNode;
}

// Componenta provider pentru autentificare
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Folosim hook-ul de autentificare pentru a gestiona logica
  const auth = useAuthHook();
  
  // Valorile care vor fi expuse în context
  const value = {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    userId: auth.userId,
    username: auth.username,
    errorMessage: auth.errorMessage,
    isOnlineMode: !auth.isAuthenticated ? false : true,
    signInAnonymously: auth.signInAnonymously,
    signOut: auth.signOut,
    updateUsername: auth.updateUsername,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 