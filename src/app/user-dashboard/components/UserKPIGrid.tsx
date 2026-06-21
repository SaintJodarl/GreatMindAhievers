'use client';

import React from 'react';
import { MoreVertical, Wallet, TrendingUp, Users, UserPlus } from 'lucide-react';

interface UserKPIGridProps {
  summary: {
    balance: number;
    leftVolume: number;
    rightVolume: number;
    leftLegCount: number;
    rightLegCount: number;
    totalDownlines: number;
    directReferrals: number;
    lifetimeEarnings: number;
    pendingWithdrawals: number;
  };
}

export default function UserKPIGrid({ summary }: UserKPIGridProps) {
  const {
    balance = 0,
    leftLegCount = 0,
    rightLegCount = 0,
    totalDownlines = 0,
    directReferrals = 0,
    lifetimeEarnings = 0,
  } = summary || {};

  const formatNumber = (num: number) => {
    if (num < 10) return `0${num}`;
    return num.toString();
  };

  const kpis = [
    {
      id: 'kpi-wallet',
      label: 'Available Wallet Balance',
      value: `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      trend: `₦${lifetimeEarnings.toLocaleString('en-NG', { maximumFractionDigits: 0 })} lifetime`,
      trendColor: 'text-emerald-600',
    },
    {
      id: 'kpi-total-earnings',
      label: 'Total Commissions',
      value: `₦${lifetimeEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      trend: 'All-time earnings',
      trendColor: 'text-blue-600',
    },
    {
      id: 'kpi-team',
      label: 'Total Downline Members',
      value: formatNumber(totalDownlines),
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      trend: `Left: ${leftLegCount} | Right: ${rightLegCount}`,
      trendColor: 'text-slate-500',
    },
    {
      id: 'kpi-referrals',
      label: 'Direct Sponsored Referrals',
      value: formatNumber(directReferrals),
      icon: UserPlus,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      trend: 'Sponsor network',
      trendColor: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.iconBg} ${kpi.iconColor}`}>
                  <IconComponent size={20} strokeWidth={2.5} />
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Value */}
              <div className="space-y-1">
                <h3 className="text-[13px] font-medium text-slate-500">{kpi.label}</h3>
                <div className="text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</div>
              </div>
            </div>

            {/* Trend */}
            <div className={`mt-4 text-xs font-medium flex items-center gap-1.5 ${kpi.trendColor}`}>
              {kpi.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
