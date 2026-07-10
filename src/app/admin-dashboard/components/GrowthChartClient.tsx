'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';

const data: Array<{ week: string; newMembers: number; activeMembers: number }> = [];

export default function GrowthChartClient() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 9, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
