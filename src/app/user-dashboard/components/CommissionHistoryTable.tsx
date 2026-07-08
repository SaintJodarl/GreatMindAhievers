'use client';
import React, { useState } from 'react';

interface CommissionHistoryTableProps {
  initialTransactions?: any[];
}

const typeColors: Record<string, { bg: string; color: string }> = {
  PAIRING_BONUS: { bg: 'rgba(108,71,255,0.12)', color: '#9B7AFF' },
  REFERRAL_BONUS: { bg: 'rgba(16,217,160,0.1)', color: '#10D9A0' },
  LEADERSHIP_BONUS: { bg: 'rgba(56,189,248,0.1)', color: '#38BDF8' },
  WITHDRAWAL: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
};

export default function CommissionHistoryTable({
  initialTransactions = [],
}: CommissionHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 6;

  const filtered = initialTransactions.filter(
    (c) =>
      c.type?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  if (!initialTransactions || initialTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
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
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-700">No transactions yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
          Your transaction history will populate here once you start earning commissions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
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
              {['Date', 'Type', 'Description', 'Amount', 'Status'].map((h) => (
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
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                  No transactions match your search.
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="transition-colors hover:bg-slate-50/50 border-b border-slate-100"
                >
                  <td className="px-5 py-4 text-sm font-medium text-slate-600">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border"
                      style={{
                        background: typeColors[row.type]?.bg || 'rgba(241,245,249,1)',
                        color: typeColors[row.type]?.color || '#475569',
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}
                    >
                      {row.type?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 font-medium max-w-xs truncate">
                    {row.description || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-indigo-600 font-mono-nums">
                    {row.type === 'WITHDRAWAL' || row.type === 'DEBIT' ? '-' : '+'}₦
                    {Number(row.amount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        row.status === 'COMPLETED' || row.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
