'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Plus,
  ArrowRight,
  MoreVertical,
  X,
  Calendar,
  ChevronRight,
  Info,
  Users,
} from 'lucide-react';
import UserKPIGrid from './UserKPIGrid';
import BinaryTreeSection from './BinaryTreeSection';
import EarningsChartSection from './EarningsChartSection';
import CommissionHistoryTable from './CommissionHistoryTable';
import ReferralSection from './ReferralSection';
import WithdrawalSection from './WithdrawalSection';
import KYCStatusCard from './KYCStatusCard';
import OnboardingWidget from './OnboardingWidget';
import UserActionRequiredCards from './UserActionRequiredCards';
import { useAuth } from '@/context/AuthContext';

export default function UserDashboardContent() {
  const { checkSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'earnings' | 'withdrawals'>(
    'overview'
  );
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Modal states
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStartStep, setOnboardingStartStep] = useState(1);

  // Extra data for overview
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);

  const fetchSummary = async () => {
    try {
      if (!summary) {
        setLoading(true);
      }
      setError(null);
      const res = await fetch('/api/user/dashboard-summary');
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const data = await res.json();
      setSummary(data);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ' ' +
          new Date().toLocaleDateString()
      );
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraData = async () => {
    try {
      setLoadingExtra(true);
      const [txRes, refRes] = await Promise.all([
        fetch('/api/wallet/transactions?limit=5'),
        fetch('/api/user/network/direct-referrals?limit=5'),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        setRecentTransactions(txData.transactions || []);
      }
      if (refRes.ok) {
        const refData = await refRes.json();
        setRecentReferrals(refData.referrals || []);
      }
    } catch (err) {
      console.error('Error fetching extra dashboard data:', err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchExtraData();
  }, []);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchExtraData();
    checkSession().catch((err) => console.error('Error refreshing session:', err));
    window.dispatchEvent(new Event('dashboard-refresh'));
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'network' as const, label: 'My Network', icon: '🌐' },
    { id: 'earnings' as const, label: 'Earnings', icon: '💰' },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: '🏦' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-gray-500">Loading dashboard summary...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 max-w-md mx-auto text-center">
        <p className="text-sm text-red-500 font-semibold">{error || 'Failed to load summary'}</p>
        <button onClick={handleRefreshAll} className="btn-primary text-xs px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  const userName = summary.name || 'Member';
  const announcementsCount = summary.announcementsCount || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header Navigation Bar / Welcome Banner Container */}
      <div className="relative rounded-xl overflow-hidden bg-white border border-slate-200/60 shadow-sm p-6">
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Welcome back, <span className="font-semibold text-slate-700">{userName}</span>! Here's
              what's happening today.
            </p>
            <div className="flex items-center gap-3 mt-4 text-[11px] font-semibold">
              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono border border-slate-200/60">
                ID: {summary.referralCode || `GMA-${summary.id.slice(-5).toUpperCase()}`}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                  summary.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${summary.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
                {summary.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-auto">
            {/* Notification Bell */}
            <Link
              href="/user-dashboard/announcements/news"
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-all duration-200 border border-slate-200/60"
              title="View News & Announcements"
            >
              <Bell size={18} />
              {announcementsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {announcementsCount}
                </span>
              )}
            </Link>

            {/* Register Member Primary Button */}
            <Link
              href="/user-dashboard/registration/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm text-[13px]"
            >
              <Plus size={16} />
              Register Member
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Overlapping Tab Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-200 pb-2">
        <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((tab) => (
            <button
              key={`user-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-1 py-1.5 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-gray-600 font-bold shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 3. Content Panel */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <UserActionRequiredCards
            summary={summary}
            onOpenAction={(step) => {
              setOnboardingStartStep(step);
              setShowOnboardingModal(true);
            }}
          />

          {/* KPI metrics grid */}
          <UserKPIGrid summary={summary} />

          {/* Two-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (Wide) - Recent Wallet Transactions */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your latest financial activity and earnings
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight size={14} />
                  </button>
                </div>

                {loadingExtra ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="text-xs text-gray-400">Loading transactions...</p>
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                      <Calendar size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-700">No Transactions Yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Transactions and bonuses will appear here once processed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((txn) => {
                      const isCredit = [
                        'CREDIT',
                        'REFERRAL_BONUS',
                        'PAIRING_BONUS',
                        'LEADERSHIP_BONUS',
                        'DEPOSIT',
                        'ADJUSTMENT',
                      ].includes(txn.type);
                      return (
                        <div
                          key={txn.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all duration-200 group hover:shadow-sm"
                        >
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {txn.description || txn.type.replace('_', ' ')}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 font-medium">
                              <span>
                                Amount:{' '}
                                <span className="font-bold text-gray-700 font-mono-nums">
                                  ₦
                                  {txn.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </span>
                              </span>
                              <span>•</span>
                              <span className="font-mono text-[11px]">Ref: {txn.reference}</span>
                              <span>•</span>
                              <span>{formatDate(txn.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                            {/* Type Pill */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                                isCredit
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {isCredit ? '+' : '-'} {txn.type.replace(/_/g, ' ')}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedTxn(txn)}
                                className="bg-white hover:bg-indigo-50 text-indigo-700 border border-gray-200 hover:border-indigo-200 font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 text-xs shadow-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setSelectedTxn(txn)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Narrow) - Recent Referrals */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Direct Referrals</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Your sponsored network members</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('network')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight size={14} />
                  </button>
                </div>

                {loadingExtra ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="text-xs text-gray-400">Loading referrals...</p>
                  </div>
                ) : recentReferrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                      <Users size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No Referrals Yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Share your referral link to build your team!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReferrals.map((user) => {
                      const initials = user.name
                        ? user.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : '??';

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Initials Circle */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">
                                {user.name}
                              </h4>
                              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`inline-block w-1 h-1 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}
                                />
                                <span className="text-[9px] text-gray-500 font-bold uppercase">
                                  {user.status}
                                </span>
                                <span className="text-[9px] text-gray-400 font-medium">
                                  • L: {user.leftLegCount} | R: {user.rightLegCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0 pl-1">
                            <Link
                              href={`/user-dashboard/network/tree?rootId=${user.id}`}
                              className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-all"
                            >
                              Tree <ChevronRight size={12} className="mt-0.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick links to core modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-150 border-t-4 border-t-cyan-500 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Registration Completion</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Confirm your personal and banking details for handover-ready access.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    summary.kycStatus === 'APPROVED' || summary.kycStatus === 'COMPLETE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {summary.kycStatus}
                </span>
                <Link
                  href="/user-dashboard/kyc/complete"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 hover:underline"
                >
                  Manage <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 border-t-4 border-t-indigo-500 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Referral Link</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Share your registration invite link with new members to grow your downline.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-mono bg-gray-50 px-2 py-0.5 border border-gray-100 rounded text-gray-600 font-bold">
                  {summary.referralCode || 'N/A'}
                </span>
                <Link
                  href="/user-dashboard/referrals/link"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 hover:underline"
                >
                  Get Link <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 border-t-4 border-t-rose-500 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Support & Help</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Submit support requests to our staff if you run into any operational problems.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold">
                  Open tickets: {summary.openTicketsCount || 0}
                </span>
                <Link
                  href="/user-dashboard/support/tickets"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 hover:underline"
                >
                  Open Ticket <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReferralSection initialReferrals={recentReferrals} summary={summary} />
            <BinaryTreeSection summary={summary} />
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6 animate-fade-in">
          <EarningsChartSection data={[]} />
          <CommissionHistoryTable initialTransactions={recentTransactions} />
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="animate-fade-in">
          <WithdrawalSection summary={summary} />
        </div>
      )}

      {/* Onboarding Modal Overlay */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowOnboardingModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <OnboardingWidget
              summary={summary}
              onRefresh={handleRefreshAll}
              initialStep={onboardingStartStep}
              onClose={() => setShowOnboardingModal(false)}
            />
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info size={18} className="text-indigo-600" />
                Transaction Receipt
              </h3>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Large Amount */}
              <div className="text-center py-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-3xl font-extrabold text-indigo-900 mt-1 font-mono-nums">
                  ₦{selectedTxn.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Reference
                  </p>
                  <p className="text-gray-800 font-mono mt-1 break-all bg-gray-50 border border-gray-100 p-2 rounded-lg">
                    {selectedTxn.reference}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Transaction Type
                  </p>
                  <p className="text-gray-800 mt-1 break-all bg-gray-50 border border-gray-100 p-2 rounded-lg">
                    {selectedTxn.type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Status
                  </p>
                  <p className="text-gray-800 mt-1 flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-2 rounded-lg uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {selectedTxn.status || 'COMPLETED'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Date & Time
                  </p>
                  <p className="text-gray-800 mt-1 bg-gray-50 border border-gray-100 p-2 rounded-lg">
                    {new Date(selectedTxn.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(selectedTxn.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Description
                </p>
                <div className="mt-1 bg-gray-50 border border-gray-100 p-3 rounded-lg text-gray-700 leading-relaxed">
                  {selectedTxn.description || 'No description provided for this transaction.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedTxn(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/10"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
