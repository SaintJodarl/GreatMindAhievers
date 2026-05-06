'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';

const data = [
  { week: 'Feb W1', binary: 4200, referral: 1400, rank: 800 },
  { week: 'Feb W2', binary: 5800, referral: 2100, rank: 600 },
  { week: 'Feb W3', binary: 4900, referral: 1800, rank: 1200 },
  { week: 'Feb W4', binary: 7200, referral: 2400, rank: 800 },
  { week: 'Mar W1', binary: 6500, referral: 2000, rank: 1000 },
  { week: 'Mar W2', binary: 8400, referral: 3100, rank: 1400 },
  { week: 'Mar W3', binary: 7600, referral: 2800, rank: 600 },
  { week: 'Mar W4', binary: 9200, referral: 3400, rank: 2000 },
  { week: 'Apr W1', binary: 10400, referral: 3800, rank: 1200 },
  { week: 'Apr W2', binary: 8800, referral: 3200, rank: 1600 },
  { week: 'Apr W3', binary: 11200, referral: 4100, rank: 1800 },
  { week: 'Apr W4', binary: 9800, referral: 3600, rank: 1000 },
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((s, p) => s + p.value, 0);
    return (
      <div className="p-3 rounded-lg text-xs" style={{ background: '#1A1D2E', border: '1px solid #252840', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <p className="font-semibold mb-2" style={{ color: '#E8EAFF' }}>{label}</p>
        {payload.map((entry) => (
          <div key={`ctooltip-${entry.name}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: entry.fill }} />
              <span style={{ color: '#A0A8C8' }}>{entry.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: '#E8EAFF' }}>
              ₦{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t" style={{ borderColor: '#252840' }}>
          <span style={{ color: '#A0A8C8' }}>Total</span>
          <span className="font-mono font-bold" style={{ color: '#E8EAFF' }}>₦{total.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function CommissionBarChartClient() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="binary" name="Binary Match" stackId="a" fill="#6C47FF" radius={[0, 0, 0, 0]} />
        <Bar dataKey="referral" name="Referral Bonus" stackId="a" fill="#10D9A0" />
        <Bar dataKey="rank" name="Rank Reward" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}