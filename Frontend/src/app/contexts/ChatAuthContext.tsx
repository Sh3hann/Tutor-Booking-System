/**
 * Chat auth context - JWT + localStorage persistence
 * Restores auth state on app load (no logout on refresh)
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getStoredUser,
  getStoredToken,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  type AuthUser,
} from '../utils/authService';
import { disconnectSocket } from '../utils/socketService';

interface ChatAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: 'student' | 'tutor') => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser> & Record<string, any>) => void;
}

const ChatAuthContext = createContext<ChatAuthContextType | null>(null);

export function ChatAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getStoredToken();
    if (stored && token) {
      setUser(stored);
      // Fetch fresh user data from server to pick up any profile changes (e.g. photoUrl)
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
      const base =
        (host === 'localhost' || host === '127.0.0.1')
          ? `${origin}/api`
          : `http://${host}:3001/api`;
      fetch(`${base}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.user) {
            const freshUser = data.user;
            setUser(freshUser);
            try { localStorage.setItem('user', JSON.stringify(freshUser)); } catch {}
          }
        })
        .catch(() => {}); // silently ignore if backend is down
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await authLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string, role: 'student' | 'tutor') => {
      const { user: u } = await authRegister(email, password, fullName, role);
      setUser(u);
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser> & Record<string, any>) => {
    setUser(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      // Persist to localStorage so refresh also has the update (use same key as authService)
      try {
        const stored = localStorage.getItem('user');
        const base = stored ? JSON.parse(stored) : prev;
        localStorage.setItem('user', JSON.stringify({ ...base, ...updates }));
      } catch {}
      return merged;
    });
  }, []);

  return (
    <ChatAuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </ChatAuthContext.Provider>
  );
}

export function useChatAuth() {
  const ctx = useContext(ChatAuthContext);
  if (!ctx) throw new Error('useChatAuth must be used within ChatAuthProvider');
  return ctx;
}
