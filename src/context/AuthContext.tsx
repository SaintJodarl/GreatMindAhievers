'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { forceLogout, BASE_URL } from '@/lib/api-client';

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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifies session purely via the /me endpoint
  const checkSession = async () => {
    try {
      const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (!meRes.ok) {
        forceLogout(); // ONLY ONCE
        return;
      }

      const data = await meRes.json();
      setUser(data.user);
    } catch (err) {
      forceLogout();
    } finally {
      setLoading(false);
    }
  };

  // Run session check on mount and bind tab focus listener
  useEffect(() => {
    checkSession();
    window.addEventListener('focus', checkSession);
    return () => window.removeEventListener('focus', checkSession);
  }, []);

  const login = async (email: string, password: string) => {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setUser(data.user);

    // Redirect based on role
    // Using window.location.href instead of router.push to bypass Next.js App Router client-side cache
    // which sometimes aggressively caches the unauthenticated state/middleware redirect
    if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
      window.location.href = '/admin-dashboard';
    } else {
      window.location.href = '/user-dashboard';
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.push('/sign-up-login-screen');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
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
