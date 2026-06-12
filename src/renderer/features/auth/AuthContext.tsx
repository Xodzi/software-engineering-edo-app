/* eslint-disable react-refresh/only-export-components */
// src/renderer/features/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrentUser } from '@shared/types';

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем пользователя **после** первого рендера
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const result = await window.electronAPI.auth.getCurrentUser();
        if (result && !('error' in result)) {
          setUser(result);
        }
      } catch (err) {
        console.error('Failed to load current user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Небольшая задержка + requestAnimationFrame помогает избежать конфликта с MobX
    const timer = setTimeout(() => {
      loadCurrentUser();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await window.electronAPI.auth.login({ email, password });
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await window.electronAPI.auth.register({ name, email, password });
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await window.electronAPI.auth.logout();
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
