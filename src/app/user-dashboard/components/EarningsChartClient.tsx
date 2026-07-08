'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
interface EarningsChartClientProps {
  data?: Array<{ day: string; left: number; right: number }>;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          background: '#1A1D2E',
          border: '1px solid #252840',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <p className="font-semibold mb-2" style={{ color: '#E8EAFF' }}>
          {label}
        </p>
        {payload.map((entry) => (
          <div key={`tooltip-${entry.name}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span style={{ color: '#A0A8C8' }}>{entry.name} Leg</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: '#E8EAFF' }}>
              {entry.value.toLocaleString()} PV
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EarningsChartClient({ data = [] }: EarningsChartClientProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[240px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">No earnings data yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center">
          Your chart will populate as you generate network volume.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="leftGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="rightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="left"
          name="Left"
          stroke="#6C47FF"
          strokeWidth={2}
          fill="url(#leftGradient)"
        />
        <Area
          type="monotone"
          dataKey="right"
          name="Right"
          stroke="#38BDF8"
          strokeWidth={2}
          fill="url(#rightGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
