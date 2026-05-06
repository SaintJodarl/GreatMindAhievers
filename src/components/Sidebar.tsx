'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  role: 'user' | 'admin';
}

const userNavItems = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/user-dashboard', icon: GridIcon },
    ],
  },
  {
    group: 'Network',
    items: [
      { label: 'My Network', href: '/user-dashboard#network', icon: NetworkIcon },
      { label: 'Referrals', href: '/user-dashboard#referrals', icon: UsersIcon },
    ],
  },
  {
    group: 'Finance',
    items: [
      { label: 'Earnings', href: '/user-dashboard#earnings', icon: TrendingIcon },
      { label: 'Withdrawals', href: '/user-dashboard#withdrawals', icon: WalletIcon },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'KYC Verification', href: '/user-dashboard#kyc', icon: ShieldIcon },
      { label: 'Profile', href: '/user-dashboard#profile', icon: UserIcon },
    ],
  },
];

const adminNavItems = [
  {
    group: 'Overview',
    items: [
      { label: 'Admin Dashboard', href: '/admin-dashboard', icon: GridIcon },
    ],
  },
  {
    group: 'Management',
    items: [
      { label: 'User Management', href: '/admin-dashboard#users', icon: UsersIcon },
      { label: 'KYC Review', href: '/admin-dashboard#kyc', icon: ShieldIcon },
      { label: 'Withdrawals', href: '/admin-dashboard#withdrawals', icon: WalletIcon },
    ],
  },
  {
    group: 'Network',
    items: [
      { label: 'Binary Tree', href: '/admin-dashboard#tree', icon: NetworkIcon },
      { label: 'Commissions', href: '/admin-dashboard#commissions', icon: TrendingIcon },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Analytics', href: '/admin-dashboard#analytics', icon: BarChartIcon },
      { label: 'Settings', href: '/admin-dashboard#settings', icon: SettingsIcon },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    const base = href.split('#')[0];
    return pathname === base || pathname === '/';
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      style={{
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className={`flex items-center border-b px-3 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderColor: 'var(--border)', minHeight: 64 }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <AppLogo size={32} />
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--foreground)' }}>
                GMA
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                Network
              </div>
            </div>
          </div>
        )}
        {collapsed && <AppLogo size={28} />}
        <button
          onClick={onToggle}
          className={`hidden lg:flex p-1.5 rounded-lg transition-colors hover:bg-muted flex-shrink-0 ${collapsed ? '' : ''}`}
          style={{ color: 'var(--muted-foreground)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg transition-colors hover:bg-muted"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <XIcon />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: role === 'admin' ? 'rgba(108,71,255,0.1)' : 'rgba(16,217,160,0.08)' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: role === 'admin' ? 'var(--primary)' : 'var(--accent)' }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: role === 'admin' ? 'var(--primary)' : 'var(--accent)' }}
            >
              {role === 'admin' ? 'Admin Panel' : 'Member Portal'}
            </span>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {navItems.map((group) => (
          <div key={`group-${group.group}`}>
            {!collapsed && (
              <p
                className="px-2 mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}
              >
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={`nav-${item.label}`}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
                      transition-all duration-150 group relative
                      ${active
                        ? 'text-white' :'hover:bg-muted'
                      }
                    `}
                    style={
                      active
                        ? {
                            background: 'linear-gradient(135deg, rgba(108,71,255,0.25) 0%, rgba(108,71,255,0.1) 100%)',
                            color: 'var(--primary)',
                            boxShadow: 'inset 2px 0 0 var(--primary)',
                          }
                        : { color: 'var(--secondary-foreground)' }
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} active={active} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && (
                      <div
                        className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                        style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                      >
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)', color: '#fff' }}
            >
              {role === 'admin' ? 'A' : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {role === 'admin' ? 'Admin User' : 'Marcus Chen'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                {role === 'admin' ? 'admin@gma.network' : 'ID: GMA-00142'}
              </p>
            </div>
            <Link href="/" className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Sign out">
              <LogoutIcon />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Sign out">
              <LogoutIcon />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

// Icon components
function GridIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function NetworkIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="3" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5v3M9 8L3 12M9 8l6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 15c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8.5c1.38 0 2.5 1.12 2.5 2.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 15c0-1.5-.8-2.8-2-3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrendingIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <polyline points="1,13 6,8 10,11 17,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="12,4 17,4 17,9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 8h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 5l3-3h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M9 2L3 5v5c0 3.5 2.5 6.3 6 7 3.5-.7 6-3.5 6-7V5L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 9.5l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BarChartIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="9" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="5" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="1" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SettingsIcon({ size = 18 }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted-foreground)' }}>
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}