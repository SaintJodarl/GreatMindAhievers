'use client';

import React from 'react';
import { BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data: Array<{ week: string; binary: number; referral: number; rank: number }> = [];

export default function CommissionBarChartClient() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 9, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
