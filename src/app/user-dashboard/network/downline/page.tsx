'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { GitMerge, ChevronLeft, ChevronRight, RefreshCw, Layers, Award } from 'lucide-react';

interface DownlineMember {
  id: string;
  name: string;
  email: string;
  status: string;
  rank: string;
  depth: number;
  placementParent: {
    id: string;
    name: string;
  } | null;
  position: string;
  joinDate: string;
}

export default function DownlineMembersPage() {
  const { user } = useAuth();

  const [downlines, setDownlines] = useState<DownlineMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDownlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api(`/api/user/network/downline?page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch downline members');
      }

      const data = await res.json();
      setDownlines(data.downlines);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching downline members.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (user) {
      fetchDownlines();
    }
  }, [user, fetchDownlines]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        {statusStr}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Downline Members</h1>
          <p className="text-gray-500 mt-1">
            List of all members placed in your binary downline structure.
          </p>
        </div>

        <button
          onClick={fetchDownlines}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Retrieving downline members...</p>
        </div>
      ) : downlines.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <GitMerge size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Downline Members</h2>
          <p className="text-gray-500 max-w-sm text-center text-sm mb-6">
            Your downline is currently empty. Once new members register or are placed under you,
            they will appear here.
          </p>
          <Link
            href="/user-dashboard/network/tree"
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm"
          >
            View Binary Tree
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Depth / Level</th>
                  <th className="py-4 px-6">Member Details</th>
                  <th className="py-4 px-6">Placement Parent</th>
                  <th className="py-4 px-6">Leg Position</th>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {downlines.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                        <Layers size={12} />
                        Level {member.depth}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5">{member.id}</span>
                        <span className="text-xs text-gray-500">{member.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {member.placementParent ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-gray-800">
                            {member.placementParent.name}
                          </span>
                          <span className="text-gray-400 font-mono mt-0.5">
                            {member.placementParent.id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None (Root)</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase ${
                          member.position === 'LEFT'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                            : member.position === 'RIGHT'
                              ? 'bg-sky-50 text-sky-700 border border-sky-150'
                              : 'bg-gray-50 text-gray-650'
                        }`}
                      >
                        {member.position}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 border border-gray-250 text-gray-700">
                        <Award size={12} className="text-amber-500" />
                        {member.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(member.status)}</td>
                    <td className="py-4 px-6 text-gray-500">{member.joinDate}</td>
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
                <strong className="text-gray-900">{totalPages}</strong> ({total} total downlines)
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
