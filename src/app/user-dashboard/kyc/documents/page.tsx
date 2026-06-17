'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Files, Loader2, Calendar, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

export default function KycDocumentsPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
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
      setSubmission(data.submission);
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px] text-center max-w-2xl mx-auto">
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-full">
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-full">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold rounded-full">
            PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">KYC Documents</h1>
          <p className="text-gray-500 mt-1">
            Review details and files submitted for identity verification.
          </p>
        </div>
        <div>{getStatusBadge(submission.status)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit space-y-4">
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

        {/* Files Previews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Uploaded Documents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Document Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-500 block">
                  Government ID Document
                </span>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center relative shadow-inner">
                  {submission.idDocument ? (
                    <img
                      src={submission.idDocument}
                      alt="ID Document"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <HelpCircle className="mx-auto text-gray-400 mb-2" size={28} />
                      <span className="text-xs text-gray-400">No Image Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-500 block">Selfie with ID</span>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center relative shadow-inner">
                  {submission.selfie ? (
                    <img
                      src={submission.selfie}
                      alt="Selfie"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <HelpCircle className="mx-auto text-gray-400 mb-2" size={28} />
                      <span className="text-xs text-gray-400">No Image Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
