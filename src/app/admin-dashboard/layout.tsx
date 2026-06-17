'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Key,
  Wallet,
  ArrowDownToLine,
  Percent,
  ShieldCheck,
  LifeBuoy,
  FileText,
  Mail,
  BarChart3,
  UserCog,
  History,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin-dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin-dashboard/members', label: 'Member Management', icon: Users },
  { href: '/admin-dashboard/codes', label: 'Registration Codes', icon: Key },
  { href: '/admin-dashboard/wallet', label: 'Wallet & Finance', icon: Wallet },
  { href: '/admin-dashboard/withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
  { href: '/admin-dashboard/commissions', label: 'Commission Settings', icon: Percent },
  { href: '/admin-dashboard/kyc', label: 'KYC Management', icon: ShieldCheck },
  { href: '/admin-dashboard/support', label: 'Support Management', icon: LifeBuoy },
  { href: '/admin-dashboard/content', label: 'Content Management', icon: FileText },
  { href: '/admin-dashboard/welcome', label: 'Welcome Messages', icon: Mail },
  { href: '/admin-dashboard/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/admin-dashboard/roles', label: 'Admin Roles', icon: UserCog },
  { href: '/admin-dashboard/audit', label: 'Audit Logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/assets/images/app_logo.png" alt="Logo" className="h-8 w-8 rounded-lg" />
          <span className="font-bold">GMA Admin</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-indigo-900 text-white flex flex-col transition-transform duration-300 z-10
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-indigo-800">
          <img
            src="/assets/images/app_logo.png"
            alt="Logo"
            className="h-10 w-10 bg-white rounded-lg p-1"
          />
          <div>
            <h1 className="font-bold text-lg leading-tight">GMA Network</h1>
            <p className="text-xs text-indigo-300">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== '/admin-dashboard' && pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 shadow-lg text-white font-medium'
                        : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-indigo-100' : 'text-indigo-400'} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-gray-50/50">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
