'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, LogOut, ShieldAlert } from 'lucide-react';
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
  const userEmail = summary?.email || user?.email || 'Loading...';
  const kycStatus = summary?.kycStatus || 'PENDING';
  const userRank = summary?.rank || 'Entry';

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-50 flex flex-col bg-white
        transition-all duration-300 ease-in-out border-r border-gray-200
        ${collapsed ? 'w-20' : 'w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
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
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        {/* Mobile Close Toggle */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="hidden lg:flex mx-auto mt-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand Sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-200">
        {memberNavigation.map((group, index) => (
          <MemberNavGroup 
            key={index} 
            group={group} 
            collapsed={collapsed} 
            userStatus={summary?.status}
            counts={summary ? { openTickets: summary.openTicketsCount || 0, announcements: summary.announcementsCount || 0 } : undefined} 
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
                <p className="text-xs text-gray-500 font-mono truncate">ID: {summary?.referralCode || 'N/A'}</p>
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
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm"
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
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
