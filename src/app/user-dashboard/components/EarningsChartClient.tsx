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

const data = [
  { day: 'Apr 1', left: 420, right: 310 },
  { day: 'Apr 3', left: 580, right: 420 },
  { day: 'Apr 5', left: 490, right: 510 },
  { day: 'Apr 7', left: 720, right: 480 },
  { day: 'Apr 9', left: 650, right: 390 },
  { day: 'Apr 11', left: 840, right: 620 },
  { day: 'Apr 13', left: 760, right: 700 },
  { day: 'Apr 15', left: 920, right: 580 },
  { day: 'Apr 17', left: 1040, right: 810 },
  { day: 'Apr 19', left: 880, right: 930 },
  { day: 'Apr 21', left: 1120, right: 840 },
  { day: 'Apr 23', left: 980, right: 760 },
  { day: 'Apr 25', left: 1240, right: 1050 },
  { day: 'Apr 27', left: 1180, right: 920 },
  { day: 'Apr 29', left: 1420, right: 1240 },
];

const CustomTooltip = ({ active, payload, label }: {
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
        <p className="font-semibold mb-2" style={{ color: '#E8EAFF' }}>{label}</p>
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

export default function EarningsChartClient() {
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