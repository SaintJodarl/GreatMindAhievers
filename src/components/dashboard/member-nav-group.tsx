'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { NavGroup } from '@/config/member-navigation';

interface MemberNavGroupProps {
  group: NavGroup;
  collapsed: boolean;
  userStatus?: string;
  counts?: { openTickets: number; announcements: number };
}

const isAllowedRoute = (path: string) => {
  return (
    path === '/user-dashboard' ||
    path.startsWith('/user-dashboard/kyc') ||
    path.startsWith('/user-dashboard/account')
  );
};

export default function MemberNavGroup({ group, collapsed, userStatus, counts }: MemberNavGroupProps) {
  const pathname = usePathname();

  // If the group contains a dashboard item, we don't need a collapsible header usually
  // But based on the requirements, it's good to group them consistently.
  const hasActiveItem = group.items.some((item) => {
    if (item.href === '/user-dashboard' && pathname === '/user-dashboard') return true;
    if (item.href !== '/user-dashboard' && pathname.startsWith(item.href)) return true;
    return false;
  });

  const [isOpen, setIsOpen] = useState(hasActiveItem || group.title === 'Dashboard');

  return (
    <div className="mb-2">
      {!collapsed && group.title !== 'Dashboard' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
        >
          <span>{group.title}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      )}

      {!collapsed && group.title === 'Dashboard' && (
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
          {group.title}
        </div>
      )}

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen || collapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 px-2 mt-1">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/user-dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href);

            const isAllowed = isAllowedRoute(item.href);
            const isLocked = userStatus && userStatus !== 'ACTIVE' && !isAllowed;

            // Render locked item
            if (isLocked) {
              return (
                <div
                  key={item.href}
                  title={collapsed ? `${item.label} (Locked)` : "Complete onboarding to unlock"}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    opacity-50 cursor-not-allowed text-gray-400 relative group select-none
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      className="flex-shrink-0 text-gray-300"
                    />
                  )}
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && <Lock size={14} className="text-gray-400 flex-shrink-0 ml-auto" />}

                  {/* Tooltip for collapsed locked state */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label} (Locked)
                  </div>
                </div>
              );
            }

            // Resolve badges next to items
            let badgeElement: React.ReactNode = null;
            if (!collapsed && counts) {
              if (item.label === 'Support Tickets' && counts.openTickets > 0) {
                badgeElement = (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full flex items-center justify-center min-w-[20px] h-[20px]">
                    {counts.openTickets}
                  </span>
                );
              } else if (item.label === 'Company News' && counts.announcements > 0) {
                badgeElement = (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center min-w-[20px] h-[20px]">
                    {counts.announcements}
                  </span>
                );
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/20'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {Icon && (
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                )}

                {!collapsed && <span className="truncate">{item.label}</span>}
                {badgeElement}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
