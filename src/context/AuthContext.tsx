import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import * as storage from '../services/storageService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  isDriver: boolean;
  isTodaPresident: boolean;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    storage.initializeData();
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = (username: string, password: string): User | null => {
    const loggedIn = storage.login(username, password);
    if (loggedIn) {
      setUser(loggedIn);
    }
    return loggedIn;
  };

  const logout = () => {
    storage.logout();
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updated = storage.updateUser(user.id, updates);
      if (updated) setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      role: user?.role || null,
      isDriver: user?.role === 'driver',
      isTodaPresident: user?.role === 'toda_president',
      isAdmin: user?.role === 'admin',
      isOperator: user?.role === 'operator',
    }}>
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
