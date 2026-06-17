'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  KeyRound,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  X
} from 'lucide-react';

interface CodeUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface CodeData {
  id: string;
  code: string;
  type: string;
  status: string; // "UNUSED" | "USED" | "REVOKED" | "EXPIRED" | "DISABLED"
  createdAt: string;
  regUser: CodeUser | null;
  kycUser: CodeUser | null;
  createdBy: string;
  expirationDate?: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCodesClient() {
  const [codes, setCodes] = useState<CodeData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals & Generate form state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    type: 'ACTIVATION', // 'REGISTRATION' | 'KYC' | 'ACTIVATION'
    count: 1,
    prefix: 'GMA-',
    expirationDays: '',
  });

  // Action status loading tracker (stores code ID being toggled)
  const [updatingCodeId, setUpdatingCodeId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        type: typeFilter,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/admin/codes?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch codes list');
      }
      
      const data = await res.json();
      setCodes(data.codes || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while loading codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [pagination.page, statusFilter, typeFilter, debouncedSearch]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generateForm.type,
          count: parseInt(generateForm.count.toString()),
          prefix: generateForm.prefix,
          expirationDays: generateForm.expirationDays ? parseInt(generateForm.expirationDays) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate codes');
      }

      setSuccessMsg(data.message || `Successfully generated ${generateForm.count} codes`);
      setShowGenerateModal(false);
      // Reset form
      setGenerateForm({
        type: 'ACTIVATION',
        count: 1,
        prefix: 'GMA-',
        expirationDays: '',
      });
      // Refresh page
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchCodes();
    } catch (err: any) {
      setError(err.message || 'Failed to generate codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusToggle = async (code: CodeData, targetStatus: string) => {
    try {
      setUpdatingCodeId(code.id);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update code status');
      }

      setSuccessMsg(data.message || `Code status updated successfully`);
      fetchCodes();
    } catch (err: any) {
      setError(err.message || 'Failed to update code');
    } finally {
      setUpdatingCodeId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'UNUSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'USED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVOKED':
      case 'DISABLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'EXPIRED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'ACTIVATION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REGISTRATION':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'KYC':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Code Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Generate and manage codes for Member Registration, KYC, and Account Activation.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md shadow-indigo-600/15"
        >
          <Plus size={18} />
          Generate Codes
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
          <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
          <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Active Codes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <KeyRound size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Activation Codes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {codes.filter((c) => c.type === 'ACTIVATION' && c.status === 'UNUSED').length} Active
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Used Codes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {codes.filter((c) => c.status === 'USED').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Expired / Revoked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {codes.filter((c) => ['REVOKED', 'DISABLED', 'EXPIRED'].includes(c.status)).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search code value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-bold uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="ACTIVATION">Activation Code</option>
              <option value="REGISTRATION">Registration Code</option>
              <option value="KYC">KYC Verification Code</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="UNUSED">Unused</option>
              <option value="USED">Used</option>
              <option value="DISABLED">Disabled</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <button
            onClick={fetchCodes}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Code Table Component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs text-gray-400">Loading code database...</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <KeyRound size={20} />
              </div>
              <p className="text-sm font-bold text-gray-700">No Codes Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Try adjusting your filters or generate new codes using the generate button.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Code String</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Expiration Date</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Redeemer details</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map((code) => {
                  const isActivation = code.type === 'ACTIVATION';
                  const isUnused = code.status === 'UNUSED';
                  const isDisabled = code.status === 'DISABLED';

                  return (
                    <tr key={code.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-mono font-bold text-indigo-700 text-sm">
                          <KeyRound size={15} className="text-indigo-400" />
                          {code.code}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          Created by: {code.createdBy}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getTypeBadgeClass(code.type)}`}>
                          {code.type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getStatusBadgeClass(code.status)}`}>
                          {code.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                        {code.expirationDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{new Date(code.expirationDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No Expiry</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {code.status === 'USED' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-gray-700 font-bold">
                              <User size={12} className="text-gray-400" />
                              <span>{code.regUser?.name || code.kycUser?.name || 'Unknown User'}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold font-mono">
                              {code.regUser?.email || code.kycUser?.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {updatingCodeId === code.id ? (
                          <Loader2 className="animate-spin text-indigo-600 inline-block mr-2" size={16} />
                        ) : isUnused ? (
                          isActivation ? (
                            <button
                              onClick={() => handleStatusToggle(code, 'DISABLED')}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors inline-flex items-center gap-1"
                            >
                              <ToggleRight size={14} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(code, 'REVOKED')}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors inline-flex items-center gap-1"
                            >
                              Revoke
                            </button>
                          )
                        ) : isDisabled && isActivation ? (
                          <button
                            onClick={() => handleStatusToggle(code, 'UNUSED')}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors inline-flex items-center gap-1"
                          >
                            <ToggleLeft size={14} />
                            Activate
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && codes.length > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-150 px-6 py-4 flex items-center justify-between text-xs text-gray-500 font-bold">
            <div>
              Showing <span className="text-gray-800 font-extrabold">{codes.length}</span> of{' '}
              <span className="text-gray-800 font-extrabold">{pagination.total}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Previous
              </button>

              <span className="text-gray-700">
                Page <span className="font-extrabold">{pagination.page}</span> of{' '}
                <span className="font-extrabold">{pagination.totalPages}</span>
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-600" />
                Generate New Codes
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGenerate}>
              <div className="p-6 space-y-4">
                {/* Code Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Code Type</label>
                  <select
                    value={generateForm.type}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                        prefix: e.target.value === 'ACTIVATION' ? 'GMA-' : prev.prefix,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  >
                    <option value="ACTIVATION">Activation Code</option>
                    <option value="REGISTRATION">Registration Code</option>
                    <option value="KYC">KYC Verification Code</option>
                  </select>
                </div>

                {/* Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Count (Bulk quantity)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generateForm.count}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({ ...prev, count: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-gray-400">Generate up to 100 codes in a single request.</p>
                </div>

                {/* Prefix */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Code Prefix</label>
                  <input
                    type="text"
                    value={generateForm.prefix}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, prefix: e.target.value }))}
                    placeholder="e.g. GMA-"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Expiration Days */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Expiration (Days - optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 30 (Leave blank for never)"
                    value={generateForm.expirationDays}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, expirationDays: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold px-4 py-2 rounded-xl transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/10 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isGenerating && <Loader2 className="animate-spin" size={14} />}
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
