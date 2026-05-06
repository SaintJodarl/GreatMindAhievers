'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const GrowthChart = dynamic(() => import('./GrowthChartClient'), { ssr: false });
const CommissionBarChart = dynamic(() => import('./CommissionBarChartClient'), { ssr: false });

export default function AdminAnalyticsSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Member growth chart */}
        <div
          className="p-5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Platform Member Growth
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              New registrations vs active member count — last 12 weeks
            </p>
          </div>
          <GrowthChart />
        </div>

        {/* Weekly commissions */}
        <div
          className="p-5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Commission Distributions (Weekly)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Binary match + referral bonuses + rank rewards paid out
            </p>
          </div>
          <CommissionBarChart />
        </div>
      </div>
      {/* Platform health metrics */}
      <div
        className="p-5 rounded-xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          Platform Health Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'KYC Approval Rate', value: '87.4%', color: 'var(--accent)', trend: '+2.1% this week', up: true },
            { label: 'Avg. Binary Pair Rate', value: '68.2%', color: 'var(--primary)', trend: '+4.8% this week', up: true },
            { label: 'Withdrawal Rejection Rate', value: '8.3%', color: 'var(--warning)', trend: '-1.2% this week', up: true },
            { label: 'Avg. Member Tenure', value: '4.2 mo', color: 'var(--info)', trend: '+0.3 mo this month', up: true },
            { label: 'Daily Active Users', value: '12,840', color: 'var(--accent)', trend: '+340 vs yesterday', up: true },
            { label: 'Avg. Daily Commission', value: '₦3,094,000', color: 'var(--primary)', trend: '+₦218,000 vs last week', up: true },
            { label: 'Suspended Accounts', value: '234', color: 'var(--negative)', trend: '+12 this week', up: false },
            { label: 'Pending KYC Backlog', value: '7', color: 'var(--warning)', trend: '-3 vs yesterday', up: true },
          ]?.map((m) => (
            <div
              key={`health-${m?.label}`}
              className="p-4 rounded-lg"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{m?.label}</p>
              <p className="text-xl font-bold font-mono-nums mb-1" style={{ color: m?.color }}>{m?.value}</p>
              <p
                className="text-xs"
                style={{ color: m?.up ? 'var(--positive)' : 'var(--negative)' }}
              >
                {m?.up ? '↑' : '↓'} {m?.trend}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}