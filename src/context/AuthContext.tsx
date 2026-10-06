import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, AdminPermission } from '../types';
import * as storage from '../services/storageService';
import * as supabaseService from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  isDriver: boolean;
  isPresident: boolean;
  isTodaPresident: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  hasPermission: (perm: AdminPermission) => boolean;
  sessionError: string | null;
  clearSessionError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    storage.initializeData();
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Single Session Enforcement check interval
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const isValid = storage.isCurrentSessionValid();
      if (!isValid) {
        setSessionError('A new login was detected on another device or browser using this account. Your current session has been logged out (Single Session Policy).');
        storage.logout();
        setUser(null);
      }
    };

    const interval = setInterval(checkSession, 5000);
    window.addEventListener('focus', checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    setSessionError(null);
    try {
      // Backend first authentication
      const result = await supabaseService.loginAsync(username, password);
      if (result.user) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Invalid username or password.' };
    } catch {
      // Fallback
      const res = storage.login(username, password);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Hindi ma-proseso ang login.' };
    }
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

  const isPresident = user?.role === 'president' || user?.role === 'toda_president';
  const isAdmin = user?.role === 'admin';

  const hasPermission = (perm: AdminPermission): boolean => {
    if (!user) return false;
    if (user.role !== 'admin') {
      if (user.role === 'president' || user.role === 'toda_president') {
        return perm === 'president';
      }
      return false;
    }
    // Admin role checks permissions array
    if (!user.adminPermissions || user.adminPermissions.length === 0) {
      return true; // default full permissions
    }
    return user.adminPermissions.includes(perm);
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
      isPresident,
      isTodaPresident: isPresident,
      isAdmin,
      isOperator: user?.role === 'operator',
      hasPermission,
      sessionError,
      clearSessionError: () => setSessionError(null),
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
