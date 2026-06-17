'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

interface KYCSubmission {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  idType: string;
  idNumber: string;
  idDocument: string | null;
  selfie: string | null;
  proofOfAddress: string | null;
  status: string; // SUBMITTED, APPROVED, REJECTED
  adminNote: string | null;
  createdAt: string;
  user: {
    email: string;
    status: string;
  };
}

export default function AdminKycClient() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal State
  const [selectedSub, setSelectedSub] = useState<KYCSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Wait, we can fetch submissions directly using an API or query.
      // Wait, since we saw `/api/admin/kyc` exists, let's fetch from it!
      // Let's verify what endpoints exist in the backend. We saw that in `/api/admin/kyc` there is a `route.ts`. Let's check what it does.
      const res = await fetch('/api/admin/kyc');
      if (!res.ok) {
        throw new Error('Failed to fetch KYC queue');
      }
      const data = await res.json();
      // Wait, let's see what data format it returns.
      // If it's an array directly or a wrapper object, let's handle it.
      setSubmissions(Array.isArray(data) ? data : data.submissions || data.queue || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading KYC queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/kyc/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve KYC submission');
      }

      setSuccessMsg('KYC submission approved successfully.');
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message || 'Error approving submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reject KYC submission');
      }

      setSuccessMsg('KYC submission rejected successfully.');
      setSelectedSub(null);
      setRejectReason('');
      setShowRejectForm(false);
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message || 'Error rejecting submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = submissions.filter((sub) => {
    const matchSearch =
      sub.fullName.toLowerCase().includes(search.toLowerCase()) ||
      sub.user?.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.idNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">KYC Compliance Review</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Verify member identities, uploaded ID scans, selfie matches, and proof of address documents.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold">
          <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold">
          <FileCheck className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, ID number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-bold uppercase">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
          >
            <option value="all">All Submissions</option>
            <option value="SUBMITTED">Submitted / Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={fetchSubmissions}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid or Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs text-gray-400">Loading KYC database...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <FileCheck size={20} />
              </div>
              <p className="text-sm font-bold text-gray-700">No KYC Submissions</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                No KYC files match your filter selection.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">ID Details</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">LGA / State</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{sub.fullName}</p>
                      <p className="text-xs text-gray-400 font-medium">{sub.user?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-700 font-bold uppercase">{sub.idType}</p>
                      <p className="text-[10px] font-semibold text-gray-400 font-mono mt-0.5">{sub.idNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-semibold">
                      {sub.lga}, {sub.state}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : sub.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setShowRejectForm(false);
                          setRejectReason('');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-xl transition-all shadow-sm shadow-indigo-600/10 inline-flex items-center gap-1.5 text-xs"
                      >
                        <Eye size={14} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck size={18} className="text-indigo-600" />
                KYC Verification Review
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Member Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-2xl text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Full Name</p>
                    <p className="text-gray-900 font-bold">{selectedSub.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Phone Number</p>
                    <p className="text-gray-900 font-bold">{selectedSub.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">LGA / State</p>
                    <p className="text-gray-900 font-bold">{selectedSub.lga}, {selectedSub.state}</p>
                  </div>
                </div>
                <div className="md:col-span-3 border-t border-gray-200/60 pt-3 flex flex-wrap justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Residential Address</span>
                    <span className="text-gray-900 font-bold">{selectedSub.address}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">ID Info</span>
                    <span className="text-gray-900 font-bold">{selectedSub.idType}: {selectedSub.idNumber}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ID Scan */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 block">1. Government Issued ID Scan</span>
                    {selectedSub.idDocument ? (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden aspect-video bg-gray-50 flex items-center justify-center shadow-sm">
                        <img
                          src={selectedSub.idDocument}
                          alt="ID Document"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-2xl aspect-video bg-gray-50 flex items-center justify-center text-xs text-gray-400 italic font-semibold">
                        No ID Scan uploaded
                      </div>
                    )}
                  </div>

                  {/* Selfie */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 block">2. Selfie holding ID</span>
                    {selectedSub.selfie ? (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden aspect-video bg-gray-50 flex items-center justify-center shadow-sm">
                        <img
                          src={selectedSub.selfie}
                          alt="Selfie"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-2xl aspect-video bg-gray-50 flex items-center justify-center text-xs text-gray-400 italic font-semibold">
                        No Selfie uploaded
                      </div>
                    )}
                  </div>

                  {/* Proof of Address */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 block">3. Proof of Address Document</span>
                    {selectedSub.proofOfAddress ? (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden aspect-video bg-gray-50 flex items-center justify-center shadow-sm">
                        <img
                          src={selectedSub.proofOfAddress}
                          alt="Proof of Address"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-2xl aspect-video bg-gray-50 flex items-center justify-center text-xs text-gray-400 italic font-semibold">
                        No Proof of Address uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Form */}
              {showRejectForm && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-rose-800">Reason for Rejection</label>
                    <textarea
                      placeholder="Please enter why these documents are being rejected (e.g. Blurry photo, expired address proof)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-sm border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-gray-900 bg-white font-semibold"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedSub.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-rose-600/10"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                Redemption state: {selectedSub.user?.status}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
                {selectedSub.status === 'SUBMITTED' && !showRejectForm && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      Reject KYC
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedSub.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                    >
                      {actionLoading && <Loader2 className="animate-spin" size={14} />}
                      <CheckCircle2 size={14} />
                      Approve KYC
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
