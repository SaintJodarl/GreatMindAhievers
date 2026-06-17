'use client';
import React from 'react';

const kpis = [
  {
    id: 'akpi-total-members',
    label: 'Total Members',
    value: '48,291',
    sub: '+342 this month',
    trendUp: true,
    color: 'var(--primary)',
    bg: 'rgba(108,71,255,0.07)',
    border: 'rgba(108,71,255,0.2)',
    span: 1,
  },
  {
    id: 'akpi-active',
    label: 'Active Members',
    value: '41,034',
    sub: '84.9% activation rate',
    trendUp: true,
    color: 'var(--accent)',
    bg: 'rgba(16,217,160,0.07)',
    border: 'rgba(16,217,160,0.2)',
    span: 1,
  },
  {
    id: 'akpi-total-liabilities',
    label: 'Platform Liabilities',
    value: '₦284,720,000',
    sub: 'Total wallet balances',
    trendUp: false,
    isAlert: true,
    color: 'var(--negative)',
    bg: 'rgba(255,77,106,0.07)',
    border: 'rgba(255,77,106,0.25)',
    span: 1,
  },
  {
    id: 'akpi-commissions-paid',
    label: 'Commissions Paid (MTD)',
    value: '₦92,840,000',
    sub: 'Binary + referral + rank',
    trendUp: true,
    color: 'var(--accent)',
    bg: 'rgba(16,217,160,0.05)',
    border: 'rgba(16,217,160,0.15)',
    span: 1,
  },
  {
    id: 'akpi-pending-withdrawals',
    label: 'Pending Withdrawals',
    value: '5',
    sub: '₦6,420,000 total value',
    trendUp: false,
    isAlert: true,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    span: 1,
  },
  {
    id: 'akpi-kyc-queue',
    label: 'KYC Pending Review',
    value: '7',
    sub: '3 flagged for manual check',
    trendUp: false,
    isAlert: true,
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    span: 1,
  },
  {
    id: 'akpi-binary-volume',
    label: 'Total Binary Volume (MTD)',
    value: '8.24M PV',
    sub: 'Across all active nodes',
    trendUp: true,
    color: 'var(--info)',
    bg: 'rgba(56,189,248,0.07)',
    border: 'rgba(56,189,248,0.2)',
    span: 1,
  },
  {
    id: 'akpi-new-registrations',
    label: 'New Registrations (7d)',
    value: '184',
    sub: '+22% vs prior week',
    trendUp: true,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.07)',
    border: 'rgba(167,139,250,0.2)',
    span: 1,
  },
];

export default function AdminKPIGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpis?.map((kpi) => (
        <div
          key={kpi?.id}
          className="p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
          style={{ background: kpi?.bg, border: `1px solid ${kpi?.border}` }}
        >
          <div className="flex items-start justify-between mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider leading-tight"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.07em' }}
            >
              {kpi?.label}
            </p>
            {kpi?.isAlert && <span style={{ color: kpi?.color, fontSize: 14 }}>⚠</span>}
          </div>
          <p className="text-2xl font-bold font-mono-nums mb-1" style={{ color: kpi?.color }}>
            {kpi?.value}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {kpi?.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
