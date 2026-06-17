'use client';

import React, { useState, useEffect } from 'react';
import { History, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface RegistrationRecord {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  placementPosition: string;
  codeUsed: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RegistrationHistoryTable() {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const limit = 10;

  const fetchHistory = async (pageNumber: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/user/registration/history?page=${pageNumber}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch registration history.');
      }
      const data = await response.json();
      setRegistrations(data.registrations);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  if (isLoading && registrations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 size={36} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading registration records...</p>
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
        <p className="text-gray-500 text-sm text-center max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchHistory(page)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <History size={32} />
        </div>
        <p className="text-gray-600 font-bold text-lg mb-1">No manual registrations found</p>
        <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
          Members you directly register using your activation codes will show up here.
        </p>
      </div>
    );
  }

  const startRecord = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Registered Members</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {startRecord}–{endRecord} of {pagination?.total || 0} registrations
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                User Registered
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Registration Code
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Placement Position
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Registration Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registrations.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{row.name}</div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                </td>
                <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-650">
                  {row.codeUsed}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.placementPosition === 'LEFT'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.placementPosition === 'LEFT' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                    />
                    {row.placementPosition === 'LEFT' ? 'Left Leg' : 'Right Leg'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-550 font-mono-nums">
                  {new Date(row.registrationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={`page-${p}`}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
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
              className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
