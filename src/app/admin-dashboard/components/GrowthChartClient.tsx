'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';

const data = [
  { week: 'Feb W1', newMembers: 142, activeMembers: 34200 },
  { week: 'Feb W2', newMembers: 198, activeMembers: 34820 },
  { week: 'Feb W3', newMembers: 167, activeMembers: 35100 },
  { week: 'Feb W4', newMembers: 224, activeMembers: 35680 },
  { week: 'Mar W1', newMembers: 189, activeMembers: 36200 },
  { week: 'Mar W2', newMembers: 312, activeMembers: 37100 },
  { week: 'Mar W3', newMembers: 278, activeMembers: 37820 },
  { week: 'Mar W4', newMembers: 341, activeMembers: 38540 },
  { week: 'Apr W1', newMembers: 295, activeMembers: 39200 },
  { week: 'Apr W2', newMembers: 387, activeMembers: 40100 },
  { week: 'Apr W3', newMembers: 342, activeMembers: 40840 },
  { week: 'Apr W4', newMembers: 184, activeMembers: 41034 },
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg text-xs" style={{ background: '#1A1D2E', border: '1px solid #252840', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <p className="font-semibold mb-2" style={{ color: '#E8EAFF' }}>{label}</p>
        {payload.map((entry) => (
          <div key={`gtooltip-${entry.name}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span style={{ color: '#A0A8C8' }}>{entry.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: '#E8EAFF' }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function GrowthChartClient() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Line yAxisId="left" type="monotone" dataKey="newMembers" name="New Registrations" stroke="#6C47FF" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="activeMembers" name="Active Members" stroke="#10D9A0" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}