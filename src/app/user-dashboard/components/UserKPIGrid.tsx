'use client';

import React from 'react';
import { Wallet, TrendingUp, Users, UserPlus } from 'lucide-react';

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
      iconBg: 'bg-emerald-100/50',
      cardBg: 'bg-emerald-50/40',
      cardBorder: 'border-emerald-200/60',
      labelColor: 'text-emerald-600/80',
      valueColor: 'text-emerald-950',
      trend: `₦${lifetimeEarnings.toLocaleString('en-NG', { maximumFractionDigits: 0 })} lifetime`,
      trendColor: 'text-emerald-700',
    },
    {
      id: 'kpi-total-earnings',
      label: 'Total Commissions',
      value: `₦${lifetimeEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100/50',
      cardBg: 'bg-blue-50/40',
      cardBorder: 'border-blue-200/60',
      labelColor: 'text-blue-600/80',
      valueColor: 'text-blue-950',
      trend: 'All-time earnings',
      trendColor: 'text-blue-700',
    },
    {
      id: 'kpi-team',
      label: 'Total Downline Members',
      value: formatNumber(totalDownlines),
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100/50',
      cardBg: 'bg-purple-50/40',
      cardBorder: 'border-purple-200/60',
      labelColor: 'text-purple-600/80',
      valueColor: 'text-purple-950',
      trend: `Left: ${leftLegCount} | Right: ${rightLegCount}`,
      trendColor: 'text-purple-700/80',
    },
    {
      id: 'kpi-referrals',
      label: 'Direct Sponsored Referrals',
      value: formatNumber(directReferrals),
      icon: UserPlus,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100/50',
      cardBg: 'bg-orange-50/40',
      cardBorder: 'border-orange-200/60',
      labelColor: 'text-orange-600/80',
      valueColor: 'text-orange-950',
      trend: 'Sponsor network',
      trendColor: 'text-orange-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`${kpi.cardBg} flex min-w-0 flex-col justify-between rounded-xl border ${kpi.cardBorder} p-4 shadow-sm transition-all duration-200 hover:shadow-md`}
          >
            <div>
              {/* Card Header */}
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}
                >
                  <IconComponent size={18} strokeWidth={2.5} />
                </div>
              </div>

              {/* Value */}
              <div className="space-y-1">
                <h3 className={`text-[13px] font-semibold ${kpi.labelColor}`}>{kpi.label}</h3>
                <div className={`break-words text-xl font-bold tracking-tight ${kpi.valueColor}`}>
                  {kpi.value}
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${kpi.trendColor}`}>
              {kpi.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
