'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import MemberSidebar from './dashboard/member-sidebar';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  role?: 'user' | 'admin';
}

const isAllowedRoute = (path: string) => {
  return path === '/user-dashboard' || path.startsWith('/user-dashboard/account');
};

export default function AppLayout({ children, role = 'user' }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [status, setStatus] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(role === 'user');

  // Load sidebar collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('gma-sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Fetch status on path changes to dynamic locking
  useEffect(() => {
    if (role === 'user') {
      fetch('/api/user/dashboard-summary')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStatus(data.status);
          }
        })
        .catch((err) => console.error('Error loading summary status:', err))
        .finally(() => setLoadingStatus(false));
    } else {
      setLoadingStatus(false);
    }
  }, [role, pathname]);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('gma-sidebar-collapsed', String(nextState));
  };

  const isAllowed = isAllowedRoute(pathname);
  const isLocked = role === 'user' && !loadingStatus && status && status !== 'ACTIVE' && !isAllowed;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {role === 'user' ? (
        <MemberSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          role={role}
        />
      )}

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          role === 'user'
            ? sidebarCollapsed
              ? 'lg:pl-20'
              : 'lg:pl-64'
            : sidebarCollapsed
              ? 'lg:pl-16'
              : 'lg:pl-60'
        }`}
      >
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex min-h-14 items-center justify-between border-b px-3 py-2.5 sm:px-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Open member navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)' }}
            >
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              GMA
            </span>
          </div>
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-4 sm:py-5 lg:px-5 xl:px-6">
            {isLocked ? (
              <div className="max-w-xl mx-auto mt-12 p-8 bg-white border border-gray-150 rounded-3xl shadow-sm text-center space-y-6">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Access Restricted
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                    Your account is currently in a{' '}
                    <span className="font-semibold text-indigo-600">
                      {status?.replace('_', ' ')}
                    </span>{' '}
                    status. Please contact support if you believe this is an error.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link
                    href="/user-dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-sm"
                  >
                    Go to Overview
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
