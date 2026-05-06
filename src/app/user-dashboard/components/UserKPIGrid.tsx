'use client';
import React from 'react';

const kpis = [
  {
    id: 'kpi-wallet',
    label: 'Wallet Balance',
    value: '₦3,847,500',
    sub: 'Available to withdraw',
    trend: '+₦240,000 today',
    trendUp: true,
    color: 'var(--accent)',
    bgColor: 'rgba(16,217,160,0.06)',
    borderColor: 'rgba(16,217,160,0.2)',
    icon: WalletKPIIcon,
    span: 2,
  },
  {
    id: 'kpi-binary-left',
    label: 'Left Leg Volume',
    value: '14,820 PV',
    sub: 'Carry-forward: 2,340 PV',
    trend: '+1,240 PV this week',
    trendUp: true,
    color: 'var(--primary)',
    bgColor: 'rgba(108,71,255,0.06)',
    borderColor: 'rgba(108,71,255,0.2)',
    icon: LeftLegIcon,
    span: 1,
  },
  {
    id: 'kpi-binary-right',
    label: 'Right Leg Volume',
    value: '12,480 PV',
    sub: 'Carry-forward: 0 PV',
    trend: '+890 PV this week',
    trendUp: true,
    color: 'var(--info)',
    bgColor: 'rgba(56,189,248,0.06)',
    borderColor: 'rgba(56,189,248,0.2)',
    icon: RightLegIcon,
    span: 1,
  },
  {
    id: 'kpi-total-earnings',
    label: 'Total Earnings',
    value: '₦18,420,000',
    sub: 'Lifetime commissions',
    trend: '+₦1,840,000 this month',
    trendUp: true,
    color: 'var(--accent)',
    bgColor: 'rgba(16,217,160,0.04)',
    borderColor: 'rgba(16,217,160,0.15)',
    icon: EarningsIcon,
    span: 1,
  },
  {
    id: 'kpi-team',
    label: 'Total Team Size',
    value: '342',
    sub: '28 direct referrals',
    trend: '+12 this month',
    trendUp: true,
    color: '#A78BFA',
    bgColor: 'rgba(167,139,250,0.06)',
    borderColor: 'rgba(167,139,250,0.2)',
    icon: TeamIcon,
    span: 1,
  },
  {
    id: 'kpi-pending',
    label: 'Pending Withdrawal',
    value: '₦500,000',
    sub: 'Submitted Apr 28, 2026',
    trend: 'Awaiting admin approval',
    trendUp: false,
    isWarning: true,
    color: 'var(--warning)',
    bgColor: 'rgba(245,158,11,0.06)',
    borderColor: 'rgba(245,158,11,0.25)',
    icon: PendingIcon,
    span: 1,
  },
];

export default function UserKPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className={`p-5 rounded-xl transition-all duration-200 hover:translate-y-[-2px] ${
            kpi.span === 2 ? 'sm:col-span-2' : ''
          }`}
          style={{
            background: kpi.bgColor,
            border: `1px solid ${kpi.borderColor}`,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
              >
                {kpi.label}
              </p>
              <p
                className="font-bold font-mono-nums"
                style={{
                  color: kpi.color,
                  fontSize: kpi.span === 2 ? '2rem' : '1.5rem',
                  lineHeight: 1.1,
                }}
              >
                {kpi.value}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${kpi.color}15` }}
            >
              <kpi.icon color={kpi.color} />
            </div>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {kpi.sub}
          </p>
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: kpi.trendUp ? 'var(--positive)' : 'var(--warning)' }}
          >
            {kpi.trendUp ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 9l3-3 2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 4v2.5M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            )}
            {kpi.trend}
          </div>
        </div>
      ))}
    </div>
  );
}

function WalletKPIIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="5" width="16" height="11" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M1 8h16" stroke={color} strokeWidth="1.5" />
      <path d="M12 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function LeftLegIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="3.5" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M9 5.5V9M9 9L5 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="14.5" r="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
function RightLegIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="3.5" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M9 5.5V9M9 9l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="14.5" r="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
function EarningsIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <polyline points="1,13 5,9 9,11 17,3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="13,3 17,3 17,7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TeamIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6.5" cy="5.5" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M1 15c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="5" r="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M15 12c0-1.5-1-2.7-2.5-3.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PendingIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M9 5v4.5l3 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}