'use client';
import React, { useState } from 'react';
import AdminKPIGrid from './AdminKPIGrid';
import AdminUserTable from './AdminUserTable';
import AdminKYCQueue from './AdminKYCQueue';
import AdminWithdrawalApprovals from './AdminWithdrawalApprovals';
import AdminAnalyticsSection from './AdminAnalyticsSection';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'User Management', icon: '👥', badge: 12 },
  { id: 'kyc', label: 'KYC Review', icon: '🔍', badge: 7 },
  { id: 'withdrawals', label: 'Withdrawals', icon: '💸', badge: 5 },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Admin Back Office
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Great Mind Achievers — Platform Control Panel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)', color: 'var(--accent)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Platform Live
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Apr 30, 2026 · 11:23 AM
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--muted)' }}
      >
        {tabs.map((tab) => (
          <button
            key={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
              activeTab === tab.id ? 'text-white' : ''
            }`}
            style={
              activeTab === tab.id
                ? { background: 'linear-gradient(135deg, #6C47FF 0%, #8B6FFF 100%)', boxShadow: '0 2px 8px rgba(108,71,255,0.3)' }
                : { color: 'var(--muted-foreground)' }
            }
          >
            <span>{tab.icon}</span>
            {tab.label}
            {'badge' in tab && tab.badge > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={
                  activeTab === tab.id
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: 'rgba(255,77,106,0.15)', color: 'var(--negative)' }
                }
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <AdminKPIGrid />
          <AdminAnalyticsSection />
        </div>
      )}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <AdminUserTable />
        </div>
      )}
      {activeTab === 'kyc' && (
        <div className="animate-fade-in">
          <AdminKYCQueue />
        </div>
      )}
      {activeTab === 'withdrawals' && (
        <div className="animate-fade-in">
          <AdminWithdrawalApprovals />
        </div>
      )}
      {activeTab === 'analytics' && (
        <div className="animate-fade-in">
          <AdminAnalyticsSection />
        </div>
      )}
    </div>
  );
}