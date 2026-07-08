'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';

/**
 * AdminKycClient — Member Registration Status view.
 *
 * The admin KYC document review feature (Government ID, Selfie, Proof of Address
 * approve/reject workflow) has been removed per updated business requirements.
 *
 * This page now shows a simple read-only list of member registration completion
 * statuses (onboardingStatus / kycStatus) for admin visibility only.
 * No document upload fields. No approve/reject buttons. No document URLs.
 */

type MemberStatus = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  kycStatus: string | null;
  createdAt: string;
};

const getKycBadge = (kycStatus: string | null) => {
  const isComplete = kycStatus === 'COMPLETE' || kycStatus === 'APPROVED';

  if (kycStatus === 'APPROVED') {
    return {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (isComplete) {
    return {
      label: 'Complete',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
  if (kycStatus === 'SUBMITTED') {
    return {
      label: 'Submitted',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (kycStatus === 'REJECTED') {
    return {
      label: 'Rejected',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  return {
    label: 'Incomplete',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
  };
};

const getAccountBadge = (status: string) => {
  if (status === 'ACTIVE') {
    return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (status === 'INACTIVE') {
    return { label: 'Inactive', className: 'bg-gray-50 text-gray-500 border-gray-200' };
  }
  return { label: status, className: 'bg-gray-50 text-gray-500 border-gray-200' };
};

export default function AdminKycClient() {
  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: '100' });
      const res = await fetch(`/api/admin/members?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch member list');
      }

      const data = await res.json();
      const rawMembers: any[] = Array.isArray(data) ? data : data.members || data.users || [];

      setMembers(
        rawMembers.map((m: any) => ({
          id: m.id,
          name: m.name ?? null,
          email: m.email ?? null,
          status: m.status ?? 'INACTIVE',
          kycStatus: m.kycStatus ?? null,
          createdAt: m.createdAt ?? '',
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Error loading member list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [m.name, m.email].some((v) => v?.toLowerCase().includes(q));

    let matchStatus = true;
    if (statusFilter === 'complete') {
      matchStatus = m.kycStatus === 'COMPLETE' || m.kycStatus === 'APPROVED';
    } else if (statusFilter === 'incomplete') {
      matchStatus = m.kycStatus !== 'COMPLETE' && m.kycStatus !== 'APPROVED';
    } else if (statusFilter === 'active') {
      matchStatus = m.status === 'ACTIVE';
    } else if (statusFilter === 'inactive') {
      matchStatus = m.status !== 'ACTIVE';
    }

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={28} />
            Registration Status
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View member registration completion status. Document review is not required.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
        <CheckCircle2 className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
        <div>
          <p className="font-semibold">Document review disabled</p>
          <p className="text-xs mt-1 font-medium text-blue-700">
            KYC is now registration completion only (personal information + banking information). No
            document upload or admin document review is required.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-start gap-3 text-xs font-semibold">
          <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-bold uppercase">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
          >
            <option value="all">All Members</option>
            <option value="complete">Registration Complete</option>
            <option value="incomplete">Registration Incomplete</option>
            <option value="active">Account Active</option>
            <option value="inactive">Account Inactive</option>
          </select>

          <button
            onClick={fetchMembers}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs text-gray-400">Loading members...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <User size={20} />
              </div>
              <p className="text-sm font-bold text-gray-700">No members found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                No members match your filter selection.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Registration Status
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Account Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => {
                  const kycBadge = getKycBadge(m.kycStatus);
                  const accountBadge = getAccountBadge(m.status);

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 text-sm">{m.name || '—'}</p>
                        <p className="text-xs text-gray-400 font-medium">{m.email || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${kycBadge.className}`}
                        >
                          {kycBadge.label === 'Complete' || kycBadge.label === 'Approved' ? (
                            <CheckCircle2 size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          {kycBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${accountBadge.className}`}
                        >
                          {accountBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Showing {filtered.length} of {members.length} members
      </p>
    </div>
  );
}
