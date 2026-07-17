'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';
import { memberNavigation } from '@/config/member-navigation';
import MemberNavGroup from './member-nav-group';
import AppLogo from '../ui/AppLogo';

interface MemberSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function MemberSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: MemberSidebarProps) {
  const { user, logout } = useAuth();
  const [summary, setSummary] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/user/dashboard-summary');
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error('Error fetching sidebar summary:', err);
      }
    };

    fetchSummary();

    window.addEventListener('dashboard-refresh', fetchSummary);
    return () => {
      window.removeEventListener('dashboard-refresh', fetchSummary);
    };
  }, []);

  const userName = summary?.name || user?.name || 'Member User';
  const kycStatus = summary?.kycStatus || 'PENDING';
  const userRank = summary?.rank || 'Entry';

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-50 flex flex-col bg-white
        transition-all duration-300 ease-in-out border-r border-gray-200
        w-[min(20rem,calc(100vw-1.5rem))]
        ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      aria-label="Member navigation"
    >
      {/* Header & Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 flex-shrink-0">
        <div className={`flex items-center gap-3 ${collapsed ? 'mx-auto' : ''}`}>
          <div className="bg-indigo-600 rounded-lg p-1.5 flex-shrink-0">
            <AppLogo size={24} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-gray-900 leading-tight truncate">GMA Network</span>
              <span className="text-xs text-gray-500 font-medium">Member Portal</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="hidden min-h-9 min-w-9 items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Collapse Sidebar"
            aria-label="Collapse sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        {/* Mobile Close Toggle */}
        <button
          onClick={onMobileClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
          aria-label="Close member navigation"
        >
          <X size={20} />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-4 hidden min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:flex"
          title="Expand Sidebar"
          aria-label="Expand sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-gray-200">
        {memberNavigation.map((group, index) => (
          <MemberNavGroup
            key={index}
            group={group}
            collapsed={collapsed}
            onNavigate={onMobileClose}
            userStatus={summary?.status}
            counts={
              summary
                ? {
                    openTickets: summary.openTicketsCount || 0,
                    announcements: summary.announcementsCount || 0,
                  }
                : undefined
            }
          />
        ))}
      </nav>

      {/* User Info & Footer */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex-shrink-0">
        {!collapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 font-mono truncate">
                  ID: {summary?.referralCode || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 uppercase">
                {userRank}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                  kycStatus === 'APPROVED' || kycStatus === 'COMPLETE'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : kycStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                KYC {kycStatus}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => logout()}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
