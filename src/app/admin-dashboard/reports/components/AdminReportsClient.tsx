'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface UserSummary {
  total: number;
  active: number;
  inactive: number;
}

interface KycSummary {
  PENDING: number;
  SUBMITTED: number;
  APPROVED: number;
  REJECTED: number;
}

interface WalletSummary {
  totalCachedBalance: number;
}

interface WithdrawalSummary {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
}

interface CommissionSummary {
  referral: number;
  pairing: number;
  leadership: number;
  total: number;
}

interface StageDistributionItem {
  stage: string;
  stageName: string;
  count: number;
}

interface StageSummary {
  distribution: StageDistributionItem[];
  diamondCompleted: number;
}

interface RegistrationSummary {
  activeMemberCount: number;
  feePerActiveMember: number;
  totalRevenue: number;
}

interface ReportsSummaryData {
  users: UserSummary;
  registration: RegistrationSummary;
  kyc: KycSummary;
  wallet: WalletSummary;
  withdrawals: WithdrawalSummary;
  commissions: CommissionSummary;
  stages: StageSummary;
}

export default function AdminReportsClient() {
  const [data, setData] = useState<ReportsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reports/summary');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch summary data');
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (value: number) => `\u20a6${value.toLocaleString()}`;

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const reportData = {
      exportedAt: new Date().toISOString(),
      summary: data,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GMA_Admin_Report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-3 py-16">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
        <p className="text-gray-500 font-medium">Loading reports and analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl max-w-lg mx-auto mt-12 space-y-4">
        <AlertCircle className="text-red-500 mx-auto" size={36} />
        <h3 className="text-lg font-bold text-gray-900">Failed to load reports</h3>
        <p className="text-sm text-red-700">{error || 'Data is unavailable'}</p>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl mx-auto font-medium transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const kycTotal = data.kyc.PENDING + data.kyc.SUBMITTED + data.kyc.APPROVED + data.kyc.REJECTED;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">
            Generate system reports and view real-time data insights.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSummary}
            className="flex items-center justify-center p-2.5 text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 rounded-xl transition-all"
            title="Refresh statistics"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Total Members
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.users.total}</p>
            <span className="text-[10px] text-green-600 font-semibold">
              {data.users.active} Active accounts
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Registration Revenue
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {formatNaira(data.registration.totalRevenue)}
            </p>
            <span className="text-[10px] text-gray-500 font-medium">
              {data.registration.activeMemberCount} active x{' '}
              {formatNaira(data.registration.feePerActiveMember)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Total System Balance
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              ₦{data.wallet.totalCachedBalance.toLocaleString()}
            </p>
            <span className="text-[10px] text-gray-500 font-medium">Sum of all wallets</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Total Commission Paid
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              ₦{data.commissions.total.toLocaleString()}
            </p>
            <span className="text-[10px] text-gray-500 font-medium">
              Referrals + Pairings + Rewards
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Approved KYC
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.kyc.APPROVED}</p>
            <span className="text-[10px] text-gray-500 font-medium">
              {kycTotal > 0 ? Math.round((data.kyc.APPROVED / kycTotal) * 100) : 0}% success rate
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-lg font-bold text-gray-900">Compensation Stage Distribution</h3>
            <p className="text-sm text-gray-500">
              Registered / Active is account status; Starter is Entry Stage and Emerald is Stage 1.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.stages.distribution.map((item) => (
              <div key={item.stage} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {item.stageName}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-gray-900">{item.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm font-semibold text-sky-800">
            Diamond completed members: {data.stages.diamondCompleted}
          </div>
        </div>

        {/* Commissions Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Commission Allocations</h3>
            <p className="text-sm text-gray-500 mb-6">
              Visual distribution of compensation plan payments.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                <span>Direct Referral Bonuses</span>
                <span className="font-bold text-gray-900">
                  ₦{data.commissions.referral.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data.commissions.total > 0 ? (data.commissions.referral / data.commissions.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                <span>Pairing Leg Bonuses</span>
                <span className="font-bold text-gray-900">
                  ₦{data.commissions.pairing.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data.commissions.total > 0 ? (data.commissions.pairing / data.commissions.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                <span>Leadership Rewards</span>
                <span className="font-bold text-gray-900">
                  ₦{data.commissions.leadership.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data.commissions.total > 0 ? (data.commissions.leadership / data.commissions.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/30 flex items-center justify-between mt-8">
            <span className="text-sm font-semibold text-indigo-900">Total Compensation Paid:</span>
            <span className="text-xl font-extrabold text-indigo-700">
              ₦{data.commissions.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Withdrawals Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Withdrawal Ledger Overview</h3>
            <p className="text-sm text-gray-500 mb-6">
              Status breakdown of processed financial withdrawals.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                Pending Requests
              </span>
              <p className="text-xl font-bold text-amber-900 mt-1">
                {data.withdrawals.pendingCount}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                ₦{data.withdrawals.pendingAmount.toLocaleString()}
              </p>
            </div>

            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
              <span className="text-[10px] text-green-800 font-bold uppercase tracking-wider block">
                Approved Requests
              </span>
              <p className="text-xl font-bold text-green-900 mt-1">
                {data.withdrawals.approvedCount}
              </p>
              <p className="text-xs text-green-600 font-medium mt-0.5">
                ₦{data.withdrawals.approvedAmount.toLocaleString()}
              </p>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
              <span className="text-[10px] text-red-800 font-bold uppercase tracking-wider block">
                Rejected Requests
              </span>
              <p className="text-xl font-bold text-red-900 mt-1">
                {data.withdrawals.rejectedCount}
              </p>
              <p className="text-xs text-red-600 font-medium mt-0.5">
                ₦{data.withdrawals.rejectedAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-8">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              KYC Verification Distribution
            </h4>
            <div className="flex w-full h-4 rounded-full overflow-hidden shadow-sm">
              <div
                className="bg-green-500 h-full hover:opacity-90 transition-opacity"
                style={{ width: `${kycTotal > 0 ? (data.kyc.APPROVED / kycTotal) * 100 : 0}%` }}
                title={`Approved: ${data.kyc.APPROVED}`}
              />
              <div
                className="bg-blue-400 h-full hover:opacity-90 transition-opacity"
                style={{ width: `${kycTotal > 0 ? (data.kyc.SUBMITTED / kycTotal) * 100 : 0}%` }}
                title={`Submitted: ${data.kyc.SUBMITTED}`}
              />
              <div
                className="bg-yellow-400 h-full hover:opacity-90 transition-opacity"
                style={{ width: `${kycTotal > 0 ? (data.kyc.PENDING / kycTotal) * 100 : 0}%` }}
                title={`Pending: ${data.kyc.PENDING}`}
              />
              <div
                className="bg-red-400 h-full hover:opacity-90 transition-opacity"
                style={{ width: `${kycTotal > 0 ? (data.kyc.REJECTED / kycTotal) * 100 : 0}%` }}
                title={`Rejected: ${data.kyc.REJECTED}`}
              />
            </div>
            <div className="flex gap-4 justify-center flex-wrap pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span>Approved ({data.kyc.APPROVED})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                <span>Submitted ({data.kyc.SUBMITTED})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                <span>Pending ({data.kyc.PENDING})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span>Rejected ({data.kyc.REJECTED})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
