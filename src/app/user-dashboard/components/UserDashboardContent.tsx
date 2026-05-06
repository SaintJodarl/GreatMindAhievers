'use client';
import React, { useState } from 'react';
import UserKPIGrid from './UserKPIGrid';
import BinaryTreeSection from './BinaryTreeSection';
import EarningsChartSection from './EarningsChartSection';
import CommissionHistoryTable from './CommissionHistoryTable';
import ReferralSection from './ReferralSection';
import WithdrawalSection from './WithdrawalSection';
import KYCStatusCard from './KYCStatusCard';

export default function UserDashboardContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'earnings' | 'withdrawals'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'network' as const, label: 'My Network', icon: '🌐' },
    { id: 'earnings' as const, label: 'Earnings', icon: '💰' },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: '🏦' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Member Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>
              ID: GMA-00142
            </span>
            <span className="badge badge-active">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Active
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              KYC: Approved ✓
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Last updated: Apr 30, 2026 11:23 AM
          </span>
          <button className="btn-secondary text-xs px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 7A6 6 0 111 7a6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9 7H7V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--muted)' }}
      >
        {tabs.map((tab) => (
          <button
            key={`user-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
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
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <UserKPIGrid />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <EarningsChartSection />
            </div>
            <div>
              <KYCStatusCard />
            </div>
          </div>
          <CommissionHistoryTable />
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-6 animate-fade-in">
          <BinaryTreeSection />
          <ReferralSection />
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6 animate-fade-in">
          <EarningsChartSection />
          <CommissionHistoryTable />
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-6 animate-fade-in">
          <WithdrawalSection />
        </div>
      )}
    </div>
  );
}