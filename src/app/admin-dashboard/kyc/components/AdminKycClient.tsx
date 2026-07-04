'use client';

import { useEffect, useState } from 'react';
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
  X,
  ExternalLink,
  FileText,
} from 'lucide-react';

type ReviewDocumentType = 'government_id' | 'address_proof' | 'selfie';
type ReviewDecision = 'APPROVED' | 'REJECTED';
type DocumentStatus = 'MISSING' | 'UPLOADED' | 'APPROVED' | 'REJECTED' | string;
type StatusField = 'govIdStatus' | 'addressStatus' | 'selfieStatus';
type UrlField =
  | 'governmentIdUrl'
  | 'idDocument'
  | 'addressProofUrl'
  | 'proofOfAddress'
  | 'selfieUrl'
  | 'selfie';

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
  governmentIdUrl: string | null;
  selfie: string | null;
  selfieUrl: string | null;
  proofOfAddress: string | null;
  addressProofUrl: string | null;
  govIdStatus: DocumentStatus;
  addressStatus: DocumentStatus;
  selfieStatus: DocumentStatus;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    kycStatus?: string | null;
  };
}

const REVIEW_DOCUMENTS: {
  type: ReviewDocumentType;
  label: string;
  description: string;
  statusField: StatusField;
  primaryUrlField: UrlField;
  fallbackUrlField: UrlField;
}[] = [
  {
    type: 'government_id',
    label: 'Government ID',
    description: 'National ID, passport, driver license, or other government-issued identity document.',
    statusField: 'govIdStatus',
    primaryUrlField: 'governmentIdUrl',
    fallbackUrlField: 'idDocument',
  },
  {
    type: 'address_proof',
    label: 'Proof of Address Document',
    description: 'Utility bill, bank statement, or official document showing current residential address.',
    statusField: 'addressStatus',
    primaryUrlField: 'addressProofUrl',
    fallbackUrlField: 'proofOfAddress',
  },
  {
    type: 'selfie',
    label: 'Selfie',
    description: 'Recent user selfie for identity matching.',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
];

const getDocumentUrl = (
  submission: KYCSubmission,
  document: (typeof REVIEW_DOCUMENTS)[number]
) => submission[document.primaryUrlField] || submission[document.fallbackUrlField];

const isPreviewableImage = (url: string) => {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif)$/.test(cleanUrl);
};

const getStatusClass = (status: string) => {
  if (status === 'APPROVED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'REJECTED') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (status === 'UPLOADED' || status === 'SUBMITTED' || status === 'COMPLETE') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

const getDocumentStatusLabel = (status: string) => {
  if (status === 'UPLOADED') return 'Awaiting Review';
  return status;
};

const getOverallStatusLabel = (status: string) => {
  if (status === 'COMPLETE') return 'COMPLETE (LEGACY)';
  return status;
};

export default function AdminKycClient() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState<KYCSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/kyc');
      if (!res.ok) {
        throw new Error('Failed to fetch KYC queue');
      }

      const data = await res.json();
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

  const handleDocumentReview = async (
    documentType: ReviewDocumentType,
    decision: ReviewDecision
  ) => {
    if (!selectedSub) return;

    const document = REVIEW_DOCUMENTS.find((item) => item.type === documentType);
    const loadingKey = `${documentType}:${decision}`;

    try {
      setActionLoading(loadingKey);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/kyc/${selectedSub.id}/document-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, decision }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update document review');
      }

      const applyUpdate = (submission: KYCSubmission): KYCSubmission => ({
        ...submission,
        ...data.submission,
        user: {
          ...submission.user,
          kycStatus: data.user?.kycStatus ?? submission.user?.kycStatus,
        },
      });

      setSelectedSub((current) => (current ? applyUpdate(current) : current));
      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === selectedSub.id ? applyUpdate(submission) : submission
        )
      );
      setSuccessMsg(
        `${document?.label || 'Document'} ${
          decision === 'APPROVED' ? 'approved' : 'rejected'
        } successfully.`
      );
    } catch (err: any) {
      setError(err.message || 'Error updating document review.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = submissions.filter((sub) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      [sub.fullName, sub.user?.email, sub.idNumber].some((value) =>
        value?.toLowerCase().includes(query)
      );
    const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            KYC Compliance Review
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review identity, selfie, and address documents independently.
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

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start gap-3 text-xs font-semibold">
          <FileCheck className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name, email, ID number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-bold uppercase">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
          >
            <option value="all">All Submissions</option>
            <option value="SUBMITTED">Submitted / Under Review</option>
            <option value="COMPLETE">Complete (Legacy)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>

          <button
            onClick={fetchSubmissions}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-150 overflow-hidden">
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
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    ID Details
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    LGA / State
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
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
                      <p className="text-xs text-gray-400 font-medium">
                        {sub.user?.email || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-700 font-bold uppercase">{sub.idType}</p>
                      <p className="text-[10px] font-semibold text-gray-400 font-mono mt-0.5">
                        {sub.idNumber}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-semibold">
                      {sub.lga}, {sub.state}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getStatusClass(
                          sub.status
                        )}`}
                      >
                        {getOverallStatusLabel(sub.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg transition-all shadow-sm shadow-indigo-600/10 inline-flex items-center gap-1.5 text-xs"
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

      {selectedSub && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-lg border border-gray-150 shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck size={18} className="text-indigo-600" />
                KYC Document Review
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-lg text-xs font-semibold text-gray-600">
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
                    <p className="text-gray-900 font-bold">
                      {selectedSub.lga}, {selectedSub.state}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-3 border-t border-gray-200/60 pt-3 flex flex-wrap justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">
                      Residential Address
                    </span>
                    <span className="text-gray-900 font-bold">{selectedSub.address}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">
                      ID Info
                    </span>
                    <span className="text-gray-900 font-bold">
                      {selectedSub.idType}: {selectedSub.idNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Uploaded Documents
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {REVIEW_DOCUMENTS.map((document, index) => {
                    const url = getDocumentUrl(selectedSub, document);
                    const status = selectedSub[document.statusField];
                    const approveLoading =
                      actionLoading === `${document.type}:APPROVED`;
                    const rejectLoading = actionLoading === `${document.type}:REJECTED`;

                    return (
                      <div
                        key={document.type}
                        className="border border-gray-200 rounded-lg bg-white p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {index + 1}. {document.label}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                              {document.description}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusClass(
                              status
                            )}`}
                          >
                            {getDocumentStatusLabel(status)}
                          </span>
                        </div>

                        {url ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
                            {isPreviewableImage(url) ? (
                              <img
                                src={url}
                                alt={document.label}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center gap-2 px-4 text-gray-500">
                                <FileText size={26} />
                                <span className="text-xs font-bold text-gray-700">
                                  Document file
                                </span>
                                <span className="text-[11px]">
                                  Open the document to review PDF or file content.
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-200 rounded-lg aspect-video bg-gray-50 flex items-center justify-center text-xs text-gray-400 italic font-semibold">
                            Missing document
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold"
                            >
                              <ExternalLink size={13} />
                              Open Document
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={!url || actionLoading !== null || status === 'APPROVED'}
                            onClick={() => handleDocumentReview(document.type, 'APPROVED')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approveLoading ? (
                              <Loader2 className="animate-spin" size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={!url || actionLoading !== null || status === 'REJECTED'}
                            onClick={() => handleDocumentReview(document.type, 'REJECTED')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rejectLoading ? (
                              <Loader2 className="animate-spin" size={13} />
                            ) : (
                              <XCircle size={13} />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                <span>Overall KYC status:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${getStatusClass(
                    selectedSub.status
                  )}`}
                >
                  {getOverallStatusLabel(selectedSub.status)}
                </span>
                {selectedSub.user?.kycStatus && (
                  <span>Member status: {selectedSub.user.kycStatus}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
