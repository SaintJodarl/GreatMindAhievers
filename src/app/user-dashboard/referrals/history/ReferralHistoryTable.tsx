'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface ReferralRecord {
  id: string;
  name: string;
  email: string;
  status: string;
  registrationDate: string;
  placementPosition: string;
  isPlacedInTree: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReferralHistoryTable() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const limit = 10;

  const fetchReferrals = async (pageNumber: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/referrals/history?page=${pageNumber}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invitation history.');
      }
      const data = await response.json();
      setReferrals(data.referrals);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading referral history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals(page);
  }, [page]);

  if (isLoading && referrals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 size={36} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading invitation history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load History</h3>
        <p className="text-gray-550 text-sm text-center max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchReferrals(page)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <History size={32} />
        </div>
        <p className="text-gray-650 font-bold text-lg mb-1">No invitations found</p>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Once users register using your unique referral link, their details will display here.
        </p>
      </div>
    );
  }

  const startRecord = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;
  const formatSignupDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-gray-900">Referral Signups</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Showing {startRecord}–{endRecord} of {pagination?.total || 0} total referred members
        </p>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {referrals.map((row) => (
          <article
            key={row.id}
            className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-gray-900">{row.name}</h3>
                <p className="truncate text-xs text-gray-500">{row.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${
                  row.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : row.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                {row.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-gray-50 p-2">
                <p className="font-semibold text-gray-400">Placement</p>
                <p className="mt-0.5 font-bold text-gray-800">
                  {row.placementPosition === 'LEFT' && 'Left Leg'}
                  {row.placementPosition === 'RIGHT' && 'Right Leg'}
                  {row.placementPosition !== 'LEFT' &&
                    row.placementPosition !== 'RIGHT' &&
                    row.placementPosition}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-2">
                <p className="font-semibold text-gray-400">Binary Tree</p>
                <p className="mt-0.5 font-bold text-gray-800">
                  {row.isPlacedInTree ? 'Placed' : 'Pending'}
                </p>
              </div>
              <div className="col-span-2 rounded-md bg-gray-50 p-2">
                <p className="font-semibold text-gray-400">Signup Date</p>
                <p className="mt-0.5 font-medium text-gray-700">
                  {formatSignupDate(row.registrationDate)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                User Details
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Placement Position
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Account Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Placed In Binary Tree
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Signup Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {referrals.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{row.name}</div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.placementPosition === 'LEFT'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : row.placementPosition === 'RIGHT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {row.placementPosition === 'LEFT' && 'Left Leg'}
                    {row.placementPosition === 'RIGHT' && 'Right Leg'}
                    {row.placementPosition !== 'LEFT' &&
                      row.placementPosition !== 'RIGHT' &&
                      row.placementPosition}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold ${
                      row.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : row.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.status === 'ACTIVE'
                          ? 'bg-emerald-500'
                          : row.status === 'PENDING'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                    />
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {row.isPlacedInTree ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-100">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Placed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-100">
                      <AlertCircle size={14} className="text-amber-500" />
                      Pending Placement
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-550 font-mono-nums">
                  {formatSignupDate(row.registrationDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={`page-${p}`}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                    page === p
                      ? 'bg-indigo-650 text-white shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
