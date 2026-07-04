'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react';

type UploadDocumentType = 'government_id' | 'selfie' | 'address_proof';
type DocumentStatus = 'MISSING' | 'UPLOADED' | 'APPROVED' | 'REJECTED' | string;

export default function KYCDashboard() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [kycData, setKycData] = useState<{
    govIdStatus: DocumentStatus;
    selfieStatus: DocumentStatus;
    addressStatus: DocumentStatus;
    status: string;
  }>({
    govIdStatus: 'MISSING',
    selfieStatus: 'MISSING',
    addressStatus: 'MISSING',
    status: 'PENDING',
  });

  const idDocumentRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const proofOfAddressRef = useRef<HTMLInputElement>(null);

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api('/api/user/kyc/documents');
      if (res.ok) {
        const data = await res.json();
        if (data.submission) {
          setKycData({
            govIdStatus: data.submission.govIdStatus,
            selfieStatus: data.submission.selfieStatus,
            addressStatus: data.submission.addressStatus,
            status: data.submission.status,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch KYC status:', err);
      setError('Could not load KYC status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const documentLabels: Record<UploadDocumentType, string> = {
    government_id: 'Government ID',
    selfie: 'Photograph',
    address_proof: 'Proof of Address Document',
  };

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    docType: UploadDocumentType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      setError(
        `Invalid file type for ${documentLabels[docType]}. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.`
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds the 5MB limit.');
      return;
    }

    setUploading(docType);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('docType', docType);

      const res = await api('/api/kyc/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      await fetchKycStatus();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const completedCount = [kycData.govIdStatus, kycData.selfieStatus, kycData.addressStatus].filter(
    (status) => status === 'UPLOADED' || status === 'APPROVED'
  ).length;
  const allApproved =
    kycData.govIdStatus === 'APPROVED' &&
    kycData.selfieStatus === 'APPROVED' &&
    kycData.addressStatus === 'APPROVED';
  const hasRejected = [kycData.govIdStatus, kycData.selfieStatus, kycData.addressStatus].some(
    (status) => status === 'REJECTED'
  );

  const progressCopy = allApproved
    ? 'KYC verified.'
    : hasRejected
      ? 'One or more documents need to be re-uploaded.'
      : completedCount === 3
        ? 'All required documents are uploaded. Awaiting admin review.'
        : 'Complete all 3 steps to finish verification.';

  const documents = [
    {
      title: 'Government ID',
      description: "Valid National ID (NIN), Passport, or Driver's License. Must be clear and readable.",
      status: kycData.govIdStatus,
      docType: 'government_id' as UploadDocumentType,
      uploadLabel: 'Upload Government ID',
      reuploadLabel: 'Re-upload Government ID',
      inputRef: idDocumentRef,
    },
    {
      title: 'Photograph',
      description: 'A clear, recent photo of your face. Please ensure good lighting and no accessories obscure your face.',
      status: kycData.selfieStatus,
      docType: 'selfie' as UploadDocumentType,
      uploadLabel: 'Upload Photograph',
      reuploadLabel: 'Re-upload Photograph',
      inputRef: selfieRef,
    },
    {
      title: 'Proof of Address Document',
      description: 'Utility bill, bank statement, or official letter showing your name and residential address.',
      status: kycData.addressStatus,
      docType: 'address_proof' as UploadDocumentType,
      uploadLabel: 'Upload Proof of Address',
      reuploadLabel: 'Re-upload Proof of Address Document',
      inputRef: proofOfAddressRef,
    },
  ];

  const getStatusPanel = (status: DocumentStatus) => {
    if (status === 'APPROVED') {
      return {
        icon: <CheckCircle2 className="text-emerald-500" size={20} />,
        className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        label: 'Approved',
      };
    }
    if (status === 'UPLOADED') {
      return {
        icon: <Clock3 className="text-blue-400" size={20} />,
        className: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        label: 'Awaiting admin review',
      };
    }
    if (status === 'REJECTED') {
      return {
        icon: <AlertCircle className="text-red-400" size={20} />,
        className: 'bg-red-500/10 border-red-500/25 text-red-300',
        label: 'Rejected - re-upload required',
      };
    }
    return {
      icon: <div className="w-2 h-2 rounded-full bg-amber-500" />,
      className: 'bg-slate-800 border-slate-700 text-slate-300',
      label: 'Not uploaded',
    };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400">Loading your KYC profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-indigo-400" size={32} />
          <h1 className="text-3xl font-extrabold text-white">KYC Verification</h1>
        </div>
        <p className="text-slate-400">
          Upload your documents to verify your identity. Re-upload only documents that need action.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Verification Progress</h2>
          <p className="text-sm text-slate-400">{progressCopy}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-indigo-400">
            {completedCount} <span className="text-slate-600">/ 3</span>
          </span>
          <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documents.map((document) => {
          const statusPanel = getStatusPanel(document.status);
          const canUpload = document.status !== 'UPLOADED' && document.status !== 'APPROVED';
          const isUploading = uploading === document.docType;

          return (
            <div
              key={document.docType}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">{document.title}</h3>
                  {statusPanel.icon}
                </div>
                <p className="text-xs text-slate-400 mb-6">{document.description}</p>
              </div>

              <div className="mt-auto">
                {canUpload ? (
                  <button
                    onClick={() => document.inputRef.current?.click()}
                    disabled={uploading !== null}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploading
                      ? 'Uploading...'
                      : document.status === 'REJECTED'
                        ? document.reuploadLabel
                        : document.uploadLabel}
                  </button>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border ${statusPanel.className}`}
                  >
                    <span className="text-sm font-semibold">{statusPanel.label}</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={document.inputRef}
                  onChange={(e) => handleUpload(e, document.docType)}
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                  className="hidden"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
