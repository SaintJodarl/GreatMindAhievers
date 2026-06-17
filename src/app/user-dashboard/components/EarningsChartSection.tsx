'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const EarningsChart = dynamic(() => import('./EarningsChartClient'), { ssr: false });

export default function EarningsChartSection() {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Binary Volume — 30 Day Trend
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Left leg vs Right leg point volume comparison
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--primary)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Left
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--info)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Right
            </span>
          </div>
        </div>
      </div>
      <EarningsChart />
    </div>
  );
}
