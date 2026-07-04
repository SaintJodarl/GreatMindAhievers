'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Files,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

type DocumentStatus = 'MISSING' | 'UPLOADED' | 'APPROVED' | 'REJECTED' | string;
type StatusField = 'govIdStatus' | 'selfieStatus' | 'addressStatus';
type UrlField =
  | 'governmentIdUrl'
  | 'idDocument'
  | 'selfieUrl'
  | 'selfie'
  | 'addressProofUrl'
  | 'proofOfAddress';

interface KycSubmission {
  id: string;
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
  selfieStatus: DocumentStatus;
  addressStatus: DocumentStatus;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const REQUIRED_DOCUMENTS: {
  label: string;
  description: string;
  statusField: StatusField;
  primaryUrlField: UrlField;
  fallbackUrlField: UrlField;
}[] = [
  {
    label: 'Government ID',
    description: 'National ID, passport, driver license, or other government-issued identity document.',
    statusField: 'govIdStatus',
    primaryUrlField: 'governmentIdUrl',
    fallbackUrlField: 'idDocument',
  },
  {
    label: 'Selfie',
    description: 'Recent user selfie for identity matching.',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
  {
    label: 'Proof of Address',
    description: 'Utility bill, bank statement, or official document showing current residential address.',
    statusField: 'addressStatus',
    primaryUrlField: 'addressProofUrl',
    fallbackUrlField: 'proofOfAddress',
  },
];

const getDocumentUrl = (
  submission: KycSubmission,
  document: (typeof REQUIRED_DOCUMENTS)[number]
) => submission[document.primaryUrlField] || submission[document.fallbackUrlField];

const isPreviewableImage = (url: string) => {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif)$/.test(cleanUrl);
};

const getEffectiveDocumentStatus = (
  submission: KycSubmission,
  document: (typeof REQUIRED_DOCUMENTS)[number]
) => {
  const url = getDocumentUrl(submission, document);
  const status = submission[document.statusField] || 'MISSING';

  if (!url) {
    return 'MISSING';
  }
  if (status === 'MISSING') {
    return 'UPLOADED';
  }
  return status;
};

const getStatusBadge = (status: string) => {
  if (status === 'APPROVED') {
    return {
      label: 'Approved',
      className: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
    };
  }
  if (status === 'REJECTED') {
    return {
      label: 'Rejected',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertCircle,
    };
  }
  if (status === 'MISSING') {
    return {
      label: 'Missing',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      icon: HelpCircle,
    };
  }
  return {
    label: status === 'UPLOADED' ? 'Pending Review' : status,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: ShieldCheck,
  };
};

export default function KycDocumentsPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<KycSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/kyc/documents');
      if (!res.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await res.json();
      setSubmission(data.submission || null);
    } catch (err: any) {
      setError(err.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <p className="text-sm text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 max-w-md mx-auto text-center">
        <p className="text-sm text-red-500 font-semibold">{error}</p>
        <button onClick={fetchDocuments} className="btn-primary text-xs px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">KYC Documents</h1>
          <p className="text-gray-500 mt-1">View your submitted verification documents.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px] text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Files size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No documents uploaded yet</h2>
          <p className="text-gray-500 max-w-md mb-6 text-sm">
            To start using all platform features and withdraw commissions, you need to submit your
            KYC documents first.
          </p>
          <button
            onClick={() => router.push('/user-dashboard/kyc/complete')}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150 shadow-sm text-sm"
          >
            Submit Documents
          </button>
        </div>
      </div>
    );
  }

  const overallBadge = getStatusBadge(submission.status);
  const OverallIcon = overallBadge.icon;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">KYC Documents</h1>
          <p className="text-gray-500 mt-1">
            Review details and files submitted for identity verification.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold rounded-full ${overallBadge.className}`}
        >
          <OverallIcon size={14} />
          {overallBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3 border-gray-100">
            Personal Details
          </h2>

          <div>
            <span className="text-xs text-gray-400 block uppercase font-semibold">
              Full Legal Name
            </span>
            <span className="text-sm font-medium text-gray-900">{submission.fullName}</span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase font-semibold">
              Phone Number
            </span>
            <span className="text-sm font-medium text-gray-900">{submission.phone}</span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase font-semibold">Address</span>
            <span className="text-sm font-medium text-gray-900">{submission.address}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">State</span>
              <span className="text-sm font-medium text-gray-900">{submission.state}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">LGA</span>
              <span className="text-sm font-medium text-gray-900">{submission.lga}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">ID Type</span>
              <span className="text-sm font-medium text-gray-900">{submission.idType}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">ID Number</span>
              <span className="text-sm font-medium text-gray-900">{submission.idNumber}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Submitted on: {new Date(submission.createdAt).toLocaleDateString()}</span>
          </div>

          {submission.adminNote && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 mt-2 text-xs">
              <span className="font-bold text-red-800 block mb-0.5">Admin Comment:</span>
              <span className="text-red-700 italic">"{submission.adminNote}"</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Uploaded Documents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {REQUIRED_DOCUMENTS.map((document) => {
                const url = getDocumentUrl(submission, document);
                const status = getEffectiveDocumentStatus(submission, document);
                const statusBadge = getStatusBadge(status);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={document.statusField}
                    className="border border-gray-200 rounded-lg bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{document.label}</p>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          {document.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.className}`}
                      >
                        <StatusIcon size={12} />
                        {statusBadge.label}
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
                            <span className="text-xs font-bold text-gray-700">Document file</span>
                            <span className="text-[11px]">
                              Open the document to preview the uploaded file.
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-lg aspect-video bg-gray-50 flex items-center justify-center text-center p-4">
                        <div>
                          <HelpCircle className="mx-auto text-gray-400 mb-2" size={28} />
                          <span className="text-xs text-gray-400 font-semibold">
                            Not uploaded yet
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-500">Upload status</span>
                        <span className="font-bold text-gray-900">
                          {url ? 'Uploaded' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-500">Review status</span>
                        <span className="font-bold text-gray-900">{statusBadge.label}</span>
                      </div>
                    </div>

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold"
                      >
                        <ExternalLink size={13} />
                        Open Document
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
