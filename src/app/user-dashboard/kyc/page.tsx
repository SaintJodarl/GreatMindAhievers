'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function KYCDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [kycData, setKycData] = useState<{
    govIdStatus: string;
    selfieStatus: string;
    addressStatus: string;
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      setError(`Invalid file type for ${docType}. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.`);
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
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

      // Refresh KYC status from DB after successful upload
      await fetchKycStatus();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(null);
      e.target.value = ''; // Reset input
    }
  };

  const completedCount = [kycData.govIdStatus, kycData.selfieStatus, kycData.addressStatus].filter(
    (s) => s === 'UPLOADED' || s === 'APPROVED'
  ).length;

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
          Upload your documents to verify your identity. You can complete this progressively.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Verification Progress</h2>
          <p className="text-sm text-slate-400">
            {completedCount === 3
              ? 'All documents uploaded successfully. Awaiting admin review.'
              : 'Complete all 3 steps to finish verification.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-indigo-400">{completedCount} <span className="text-slate-600">/ 3</span></span>
          <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Government ID */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Government ID</h3>
              {kycData.govIdStatus === 'UPLOADED' || kycData.govIdStatus === 'APPROVED' ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Valid National ID (NIN), Passport, or Driver's License. Must be clear and readable.
            </p>
          </div>
          
          <div className="mt-auto">
            {kycData.govIdStatus === 'UPLOADED' || kycData.govIdStatus === 'APPROVED' ? (
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="text-sm font-semibold">{kycData.govIdStatus === 'APPROVED' ? 'Approved' : 'Uploaded successfully'}</span>
              </div>
            ) : (
              <button
                onClick={() => idDocumentRef.current?.click()}
                disabled={uploading !== null}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
              >
                {uploading === 'government_id' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading === 'government_id' ? 'Uploading...' : 'Upload ID'}
              </button>
            )}
            <input
              type="file"
              ref={idDocumentRef}
              onChange={(e) => handleUpload(e, 'government_id')}
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
              className="hidden"
            />
          </div>
        </div>

        {/* Selfie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Selfie Verification</h3>
              {kycData.selfieStatus === 'UPLOADED' || kycData.selfieStatus === 'APPROVED' ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              A clear, recent photo of your face. Please ensure good lighting and no accessories obscuring your face.
            </p>
          </div>
          
          <div className="mt-auto">
            {kycData.selfieStatus === 'UPLOADED' || kycData.selfieStatus === 'APPROVED' ? (
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="text-sm font-semibold">{kycData.selfieStatus === 'APPROVED' ? 'Approved' : 'Uploaded successfully'}</span>
              </div>
            ) : (
              <button
                onClick={() => selfieRef.current?.click()}
                disabled={uploading !== null}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
              >
                {uploading === 'selfie' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading === 'selfie' ? 'Uploading...' : 'Upload Selfie'}
              </button>
            )}
            <input
              type="file"
              ref={selfieRef}
              onChange={(e) => handleUpload(e, 'selfie')}
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
              className="hidden"
            />
          </div>
        </div>

        {/* Proof of Address */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Proof of Address</h3>
              {kycData.addressStatus === 'UPLOADED' || kycData.addressStatus === 'APPROVED' ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Utility bill, bank statement, or official letter showing your name and residential address (Not older than 3 months).
            </p>
          </div>
          
          <div className="mt-auto">
            {kycData.addressStatus === 'UPLOADED' || kycData.addressStatus === 'APPROVED' ? (
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="text-sm font-semibold">{kycData.addressStatus === 'APPROVED' ? 'Approved' : 'Uploaded successfully'}</span>
              </div>
            ) : (
              <button
                onClick={() => proofOfAddressRef.current?.click()}
                disabled={uploading !== null}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
              >
                {uploading === 'address_proof' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading === 'address_proof' ? 'Uploading...' : 'Upload Document'}
              </button>
            )}
            <input
              type="file"
              ref={proofOfAddressRef}
              onChange={(e) => handleUpload(e, 'address_proof')}
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
              className="hidden"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
