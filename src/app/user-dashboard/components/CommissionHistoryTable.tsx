'use client';
import React, { useState } from 'react';

const commissions = [
  {
    id: 'comm-001',
    date: 'Apr 30, 2026',
    type: 'Binary Match',
    leftVol: 1420,
    rightVol: 1240,
    matchVol: 1240,
    rate: '10%',
    amount: 124.0,
    status: 'Credited',
    fromMember: 'Chidinma Obi',
  },
  {
    id: 'comm-002',
    date: 'Apr 29, 2026',
    type: 'Referral Bonus',
    leftVol: 0,
    rightVol: 0,
    matchVol: 0,
    rate: 'Flat',
    amount: 50.0,
    status: 'Credited',
    fromMember: 'Emeka Nwosu',
  },
  {
    id: 'comm-003',
    date: 'Apr 28, 2026',
    type: 'Binary Match',
    leftVol: 1180,
    rightVol: 920,
    matchVol: 920,
    rate: '10%',
    amount: 92.0,
    status: 'Credited',
    fromMember: 'Multiple',
  },
  {
    id: 'comm-004',
    date: 'Apr 27, 2026',
    type: 'Level Bonus',
    leftVol: 0,
    rightVol: 0,
    matchVol: 0,
    rate: '5%',
    amount: 38.5,
    status: 'Credited',
    fromMember: 'Ngozi Adeyemi',
  },
  {
    id: 'comm-005',
    date: 'Apr 26, 2026',
    type: 'Binary Match',
    leftVol: 980,
    rightVol: 760,
    matchVol: 760,
    rate: '10%',
    amount: 76.0,
    status: 'Credited',
    fromMember: 'Multiple',
  },
  {
    id: 'comm-006',
    date: 'Apr 25, 2026',
    type: 'Referral Bonus',
    leftVol: 0,
    rightVol: 0,
    matchVol: 0,
    rate: 'Flat',
    amount: 50.0,
    status: 'Credited',
    fromMember: 'Tunde Bakare',
  },
  {
    id: 'comm-007',
    date: 'Apr 24, 2026',
    type: 'Binary Match',
    leftVol: 1240,
    rightVol: 1050,
    matchVol: 1050,
    rate: '10%',
    amount: 105.0,
    status: 'Pending',
    fromMember: 'Multiple',
  },
  {
    id: 'comm-008',
    date: 'Apr 23, 2026',
    type: 'Rank Bonus',
    leftVol: 0,
    rightVol: 0,
    matchVol: 0,
    rate: 'Fixed',
    amount: 200.0,
    status: 'Credited',
    fromMember: 'System',
  },
  {
    id: 'comm-009',
    date: 'Apr 22, 2026',
    type: 'Binary Match',
    leftVol: 840,
    rightVol: 620,
    matchVol: 620,
    rate: '10%',
    amount: 62.0,
    status: 'Credited',
    fromMember: 'Multiple',
  },
  {
    id: 'comm-010',
    date: 'Apr 21, 2026',
    type: 'Level Bonus',
    leftVol: 0,
    rightVol: 0,
    matchVol: 0,
    rate: '5%',
    amount: 22.75,
    status: 'Credited',
    fromMember: 'Kelechi Eze',
  },
];

const typeColors: Record<string, { bg: string; color: string }> = {
  'Binary Match': { bg: 'rgba(108,71,255,0.12)', color: '#9B7AFF' },
  'Referral Bonus': { bg: 'rgba(16,217,160,0.1)', color: '#10D9A0' },
  'Level Bonus': { bg: 'rgba(56,189,248,0.1)', color: '#38BDF8' },
  'Rank Bonus': { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
};

export default function CommissionHistoryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 6;

  const filtered = commissions.filter(
    (c) =>
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      c.fromMember.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div
      className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden"
    >
      <div
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Commission History
          </h3>
          <p className="text-xs mt-0.5 text-slate-500 font-medium">
            {filtered.length} transactions
          </p>
        </div>
        <div className="relative">
          <input
            className="input-field pl-8 pr-3 py-2 text-xs w-48"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/60">
              {['Date', 'Type', 'Match Vol (PV)', 'Rate', 'Amount', 'From', 'Status'].map((h) => (
                <th
                  key={`th-${h}`}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-slate-50/50 border-b border-slate-100"
              >
                <td
                  className="px-5 py-4 text-sm font-medium text-slate-600"
                >
                  {row.date}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border"
                    style={{
                      background: typeColors[row.type]?.bg || 'rgba(241,245,249,1)',
                      color: typeColors[row.type]?.color || '#475569',
                      borderColor: 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {row.type}
                  </span>
                </td>
                <td
                  className="px-5 py-4 text-sm text-slate-600 font-medium"
                >
                  {row.matchVol > 0 ? `${row.matchVol.toLocaleString()} PV` : '—'}
                </td>
                <td
                  className="px-5 py-4 text-sm text-slate-500 font-medium"
                >
                  {row.rate}
                </td>
                <td
                  className="px-5 py-4 text-sm font-bold text-indigo-600 font-mono-nums"
                >
                  +₦{row.amount.toFixed(2)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                  {row.fromMember}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                      row.status === 'Credited'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : row.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {row.status === 'Credited' ? '✓' : '⏳'} {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No commission records match your search.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between p-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–
          {Math.min(page * perPage, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={`page-${p}`}
              onClick={() => setPage(p)}
              className="w-7 h-7 rounded text-xs font-medium transition-all"
              style={
                page === p
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
              }
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
