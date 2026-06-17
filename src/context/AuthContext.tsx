'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '@/lib/api-client';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  onboardingStatus: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Updates the token state and sets the API client header
  const updateToken = (token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  };

  // Verifies session on mount or silent refresh
  const checkSession = async () => {
    try {
      // 1. Try silent refresh to get an active access token
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!refreshRes.ok) throw new Error('Refresh failed');
      
      const { accessToken: newAccessToken } = await refreshRes.json();
      updateToken(newAccessToken);

      // 2. Fetch user profile details
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      if (!meRes.ok) throw new Error('Failed to fetch profile');

      const { user: profile } = await meRes.json();
      setUser(profile);
    } catch (err) {
      setUser(null);
      updateToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Run session check on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Periodic silent refresh (every 14 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      checkSession();
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    updateToken(data.accessToken);
    setUser(data.user);

    // Redirect based on role
    if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
      router.push('/admin-dashboard');
    } else {
      router.push('/user-dashboard');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      updateToken(null);
      setUser(null);
      router.push('/sign-up-login-screen');
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, checkSession }}>
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
