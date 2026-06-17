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
      borderClass: 'border-t-4 border-t-emerald-500 hover:border-t-emerald-400',
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
      borderClass: 'border-t-4 border-t-blue-500 hover:border-t-blue-400',
    },
    {
      id: 'kpi-team',
      label: 'Total Downline Members',
      value: formatNumber(totalDownlines),
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      trend: `Left: ${leftLegCount} | Right: ${rightLegCount}`,
      trendColor: 'text-gray-500',
      borderClass: 'border-t-4 border-t-purple-500 hover:border-t-purple-400',
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
      borderClass: 'border-t-4 border-t-orange-500 hover:border-t-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`bg-white rounded-xl border border-gray-150 p-5 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${kpi.borderClass}`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                  <IconComponent size={18} />
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Title / Label */}
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</h3>

              {/* Large Value */}
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2 font-mono-nums">
                {kpi.value}
              </p>
            </div>

            {/* Bottom Trend / Subtext */}
            <div className={`text-xs font-semibold ${kpi.trendColor}`}>
              {kpi.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
