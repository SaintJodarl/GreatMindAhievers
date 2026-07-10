'use client';

import React from 'react';

const kpis = [
  {
    id: 'akpi-total-members',
    label: 'Total Members',
    value: '0',
    sub: 'Fresh start',
    color: 'var(--primary)',
    bg: 'rgba(108,71,255,0.07)',
    border: 'rgba(108,71,255,0.2)',
  },
  {
    id: 'akpi-active',
    label: 'Active Members',
    value: '0',
    sub: 'Awaiting first registration',
    color: 'var(--accent)',
    bg: 'rgba(16,217,160,0.07)',
    border: 'rgba(16,217,160,0.2)',
  },
  {
    id: 'akpi-total-liabilities',
    label: 'Platform Liabilities',
    value: 'NGN 0',
    sub: 'Total wallet balances',
    color: 'var(--negative)',
    bg: 'rgba(255,77,106,0.07)',
    border: 'rgba(255,77,106,0.25)',
  },
  {
    id: 'akpi-pending-withdrawals',
    label: 'Pending Withdrawals',
    value: '0',
    sub: 'No pending requests',
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
  },
] as const;

export default function AdminKPIGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
          style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider leading-tight mb-2"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.07em' }}
          >
            {kpi.label}
          </p>
          <p className="text-2xl font-bold font-mono-nums mb-1" style={{ color: kpi.color }}>
            {kpi.value}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {kpi.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
