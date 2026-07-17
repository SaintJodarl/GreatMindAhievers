'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
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
  referralCode: string | null;
  status: string;
  kycStatus: string;
  currentStageName: string;
  activationStatus: string | null;
  binaryLegRelativeToSponsor: 'LEFT' | 'RIGHT' | null;
  placementParent: {
    id: string;
    name: string;
  } | null;
  leftLegCount: number;
  rightLegCount: number;
  createdAt: string;
}

export default function DirectReferralsPage() {
  const { user } = useAuth();

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

      const res = await api(url);
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
    if (user) {
      fetchReferrals();
    }
  }, [user, fetchReferrals]);

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

  const getActivationBadge = (statusStr: string | null) => {
    const s = (statusStr || 'PENDING').toUpperCase();
    const isUsed = s === 'USED' || s === 'ACTIVE';
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
          isUsed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}
      >
        {isUsed ? 'Activated' : s.replaceAll('_', ' ')}
      </span>
    );
  };

  const getLegBadge = (leg: Referral['binaryLegRelativeToSponsor']) => {
    if (!leg) {
      return (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          Outside leg
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
          leg === 'LEFT' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
        }`}
      >
        {leg} leg
      </span>
    );
  };

  const formatJoinDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Direct Referrals
        </h1>
        <p className="text-gray-500 mt-1">View and manage members you have personally sponsored.</p>
      </div>

      {/* Filters & Actions */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between"
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

          <div className="flex w-full flex-col gap-3 min-[420px]:flex-row md:w-auto md:items-center">
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
              className="min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
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
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50"
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
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Responsive Table */}
          <div className="space-y-3 p-4 lg:hidden">
            {referrals.map((ref) => (
              <article
                key={ref.id}
                className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">
                      {ref.name || 'Unknown User'}
                    </h3>
                    <p className="break-all text-xs text-gray-500">{ref.email || 'N/A'}</p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-gray-400">
                      {ref.referralCode || ref.id}
                    </p>
                  </div>
                  {getStatusBadge(ref.status)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Stage</p>
                    <p className="mt-1 font-medium text-gray-700">{ref.currentStageName}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Sponsor Leg</p>
                    <div className="mt-1">{getLegBadge(ref.binaryLegRelativeToSponsor)}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">KYC</p>
                    <div className="mt-1">{getKycBadge(ref.kycStatus)}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Joined</p>
                    <p className="mt-1 font-medium text-gray-700">
                      {formatJoinDate(ref.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Activation</p>
                    <div className="mt-1">{getActivationBadge(ref.activationStatus)}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Placement Parent</p>
                    <p className="mt-1 truncate font-medium text-gray-700">
                      {ref.placementParent?.name || 'Not placed'}
                    </p>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                      <p className="font-semibold">Own Left</p>
                      <p className="mt-0.5 font-mono-nums text-base font-bold">
                        {ref.leftLegCount}
                      </p>
                    </div>
                    <div className="rounded-md bg-sky-50 p-2 text-sky-700">
                      <p className="font-semibold">Own Right</p>
                      <p className="mt-0.5 font-mono-nums text-base font-bold">
                        {ref.rightLegCount}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Name / Code</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6">Sponsor Leg</th>
                  <th className="py-4 px-6">Placement Parent</th>
                  <th className="py-4 px-6 text-center">Referral Network</th>
                  <th className="py-4 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div className="flex min-w-0 flex-col">
                        <span>{ref.name || 'Unknown User'}</span>
                        <span className="mt-0.5 break-all font-mono text-[10px] text-gray-400">
                          {ref.referralCode || ref.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600">
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="break-all">{ref.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        {getStatusBadge(ref.status)}
                        {getKycBadge(ref.kycStatus)}
                        {getActivationBadge(ref.activationStatus)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-gray-700">
                        {ref.currentStageName}
                      </span>
                    </td>
                    <td className="py-4 px-6">{getLegBadge(ref.binaryLegRelativeToSponsor)}</td>
                    <td className="py-4 px-6">
                      <div className="flex min-w-0 flex-col text-xs">
                        <span className="font-medium text-gray-800">
                          {ref.placementParent?.name || 'Not placed'}
                        </span>
                        {ref.placementParent?.id && (
                          <span className="mt-0.5 break-all font-mono text-[10px] text-gray-400">
                            {ref.placementParent.id}
                          </span>
                        )}
                      </div>
                    </td>
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
                        <span>{formatJoinDate(ref.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-xs text-gray-500">
                Showing page <strong className="text-gray-900">{page}</strong> of{' '}
                <strong className="text-gray-900">{totalPages}</strong> ({total} total referrals)
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`hidden rounded-lg border px-3 py-1 text-xs font-semibold transition-all sm:inline-flex ${
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
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
