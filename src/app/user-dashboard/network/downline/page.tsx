'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import {
  GitMerge,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Award,
  Filter,
} from 'lucide-react';

interface DownlineMember {
  id: string;
  name: string;
  email: string;
  status: string;
  currentStageName: string;
  activationStatus: string | null;
  relationship: 'DIRECT' | 'INDIRECT';
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
  const [leg, setLeg] = useState('');
  const [status, setStatus] = useState('');
  const [activation, setActivation] = useState('');
  const [stage, setStage] = useState('');
  const [relationship, setRelationship] = useState('');

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'REGISTERED_ACTIVE', label: 'Registered / Active' },
    { value: 'STARTER_ENTRY_STAGE', label: 'Starter' },
    { value: 'EMERALD_STAGE_1', label: 'Emerald' },
    { value: 'SILVER_STAGE_2', label: 'Silver' },
    { value: 'GOLD_STAGE_3', label: 'Gold' },
    { value: 'JASPER_STAGE_4', label: 'Jasper' },
    { value: 'SAPPHIRE_STAGE_5', label: 'Sapphire' },
    { value: 'DIAMOND_STAGE_6_FINAL', label: 'Diamond' },
  ];

  const fetchDownlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (leg) params.set('leg', leg);
      if (status) params.set('status', status);
      if (activation) params.set('activation', activation);
      if (stage) params.set('stage', stage);
      if (relationship) params.set('relationship', relationship);

      const res = await api(`/api/user/network/downline?${params.toString()}`);
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
  }, [page, limit, leg, status, activation, stage, relationship]);

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

  const resetFilters = () => {
    setLeg('');
    setStatus('');
    setActivation('');
    setStage('');
    setRelationship('');
    setPage(1);
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

  const getRelationshipBadge = (relationshipStr: DownlineMember['relationship']) => (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
        relationshipStr === 'DIRECT'
          ? 'bg-indigo-50 text-indigo-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {relationshipStr === 'DIRECT' ? 'Direct' : 'Indirect'}
    </span>
  );

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Downline Members
          </h1>
          <p className="text-gray-500 mt-1">
            List of all members placed in your binary downline structure.
          </p>
        </div>

        <button
          onClick={fetchDownlines}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} className="text-gray-400" />
          Display Filters
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <select
            value={leg}
            onChange={(e) => {
              setLeg(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="">All Legs</option>
            <option value="LEFT">Left leg</option>
            <option value="RIGHT">Right leg</option>
          </select>

          <select
            value={relationship}
            onChange={(e) => {
              setRelationship(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="">All Relationships</option>
            <option value="direct">Direct referrals</option>
            <option value="indirect">Indirect downline</option>
          </select>

          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            {stageOptions.map((option) => (
              <option key={option.value || 'all-stages'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={activation}
            onChange={(e) => {
              setActivation(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="">All Activation</option>
            <option value="USED">Activated</option>
            <option value="UNUSED">Unused code</option>
            <option value="EXPIRED">Expired code</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
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
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="space-y-3 p-4 lg:hidden">
            {downlines.map((member) => (
              <article
                key={member.id}
                className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">{member.name}</h3>
                    <p className="break-all text-xs text-gray-500">{member.email}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                      {member.id}
                    </p>
                  </div>
                  {getStatusBadge(member.status)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-indigo-50 p-2 text-indigo-700">
                    <p className="font-semibold">Depth</p>
                    <p className="mt-0.5 font-bold">Level {member.depth}</p>
                  </div>
                  <div className="rounded-md bg-sky-50 p-2 text-sky-700">
                    <p className="font-semibold">Leg</p>
                    <p className="mt-0.5 font-bold">{member.position}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Stage</p>
                    <p className="mt-0.5 font-bold text-gray-800">{member.currentStageName}</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Relationship</p>
                    <div className="mt-0.5">{getRelationshipBadge(member.relationship)}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Activation</p>
                    <div className="mt-0.5">{getActivationBadge(member.activationStatus)}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Join Date</p>
                    <p className="mt-0.5 font-medium text-gray-700">{member.joinDate}</p>
                  </div>
                  <div className="col-span-2 rounded-md bg-gray-50 p-2">
                    <p className="font-semibold text-gray-400">Placement Parent</p>
                    {member.placementParent ? (
                      <p className="mt-0.5 truncate font-medium text-gray-800">
                        {member.placementParent.name}
                      </p>
                    ) : (
                      <p className="mt-0.5 font-medium text-gray-500">None (Root)</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Depth / Level</th>
                  <th className="py-4 px-6">Member Details</th>
                  <th className="py-4 px-6">Placement Parent</th>
                  <th className="py-4 px-6">Leg Position</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6">Relationship</th>
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
                        <span className="break-all text-xs text-gray-500">{member.email}</span>
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
                      <span className="text-xs font-semibold text-gray-700">
                        {member.currentStageName}
                      </span>
                    </td>
                    <td className="py-4 px-6">{getRelationshipBadge(member.relationship)}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 border border-gray-250 text-gray-700">
                        <Award size={12} className="text-amber-500" />
                        {member.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        {getStatusBadge(member.status)}
                        {getActivationBadge(member.activationStatus)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{member.joinDate}</td>
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
                <strong className="text-gray-900">{totalPages}</strong> ({total} total downlines)
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
