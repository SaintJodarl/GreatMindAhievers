'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface Referral {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  kycStatus: string;
  leftLegCount: number;
  rightLegCount: number;
  createdAt: string;
}

export default function DirectReferralsPage() {
  const { data: session } = useSession();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/user/network/direct-referrals?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const data = await res.json();
      setReferrals(data.referrals);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching direct referrals.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    if (session?.user) {
      fetchReferrals();
    }
  }, [session, fetchReferrals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReferrals();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150">
          <CheckCircle2 size={12} />
          Active
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-150">
          <AlertCircle size={12} />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-150">
        <XCircle size={12} />
        {statusStr}
      </span>
    );
  };

  const getKycBadge = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
          Approved
        </span>
      );
    }
    if (s === 'SUBMITTED' || s === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          Under Review
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-100 text-rose-800">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
        Not Submitted
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Direct Referrals</h1>
        <p className="text-gray-500 mt-1">View and manage members you have personally sponsored.</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          <div className="relative w-full md:max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-grow md:flex-grow-0 min-w-[150px]">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <select
                value={status}
                onChange={handleStatusChange}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Apply Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPage(1);
                fetchReferrals();
              }}
              className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
              title="Reset filters"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Main Content */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Retrieving direct referrals...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Referrals Found</h2>
          <p className="text-gray-500 max-w-sm text-center text-sm mb-6">
            {search || status
              ? 'Try modifying your search or filter parameters to find matches.'
              : "You haven't sponsored anyone yet. Start sharing your referral link to grow your network!"}
          </p>
          {!search && !status && (
            <Link
              href="/user-dashboard"
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">KYC Status</th>
                  <th className="py-4 px-6 text-center">Left / Right Leg Count</th>
                  <th className="py-4 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div className="flex flex-col">
                        <span>{ref.name || 'Unknown User'}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">{ref.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600">
                        <Mail size={14} className="flex-shrink-0" />
                        <span>{ref.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(ref.status)}</td>
                    <td className="py-4 px-6">{getKycBadge(ref.kycStatus)}</td>
                    <td className="py-4 px-6 text-center font-semibold font-mono-nums">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {ref.leftLegCount} L
                        </span>
                        <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-xs">
                          {ref.rightLegCount} R
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>
                          {new Date(ref.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing page <strong className="text-gray-900">{page}</strong> of{' '}
                <strong className="text-gray-900">{totalPages}</strong> ({total} total referrals)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      p === page
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
