'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, FileX, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export default function KycStatusPage() {
  const router = useRouter();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/kyc/status');
      if (!res.ok) {
        throw new Error('Failed to fetch KYC status');
      }
      const data = await res.json();
      setKycData(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching KYC status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <p className="text-sm text-gray-500">Loading your KYC status...</p>
      </div>
    );
  }

  if (error || !kycData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 max-w-md mx-auto text-center">
        <p className="text-sm text-red-500 font-semibold">{error || 'Could not load KYC status'}</p>
        <button onClick={fetchKycStatus} className="btn-primary text-xs px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  const { kycStatus, kycSubmittedAt, kycApprovedAt, kycRejectedAt, kycRejectionReason } = kycData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registration Status</h1>
        <p className="text-gray-500 mt-1">
          Check the current status of your registration completion.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px] max-w-2xl mx-auto">
        {kycStatus === 'PENDING' && (
          <>
            <div className="w-20 h-20 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <FileCheck size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Not Complete</h2>
            <p className="text-gray-500 max-w-md text-center mb-6 text-sm">
              You have not yet completed your registration. Please provide your personal and banking
              information to unlock withdrawals and full platform features.
            </p>
            <button
              onClick={() => router.push('/user-dashboard/kyc/complete')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150 shadow-sm"
            >
              Complete Registration
            </button>
          </>
        )}

        {kycStatus === 'SUBMITTED' && (
          <>
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 border border-amber-100">
              <Clock size={40} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Under Review</h2>
            <p className="text-gray-500 max-w-md text-center mb-4 text-sm">
              Your registration is currently being reviewed by our compliance team. This is
              typically completed within 24 to 48 hours.
            </p>
            {kycSubmittedAt && (
              <p className="text-xs text-gray-400 mb-6 bg-gray-50 px-3 py-1.5 rounded">
                Submitted on: {new Date(kycSubmittedAt).toLocaleString()}
              </p>
            )}
            <button
              disabled
              className="px-6 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
            >
              Registration Pending Review
            </button>
          </>
        )}

        {(kycStatus === 'APPROVED' || kycStatus === 'COMPLETE') && (
          <>
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 border border-green-100">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {kycStatus === 'APPROVED' ? 'Account Verified' : 'Registration Complete'}
            </h2>
            <p className="text-gray-500 max-w-md text-center mb-4 text-sm">
              {kycStatus === 'APPROVED'
                ? 'Your account has been fully verified and all verification limits have been removed.'
                : 'Your personal and banking information has been saved. Account activation remains separate.'}
            </p>
            {(kycApprovedAt || kycSubmittedAt) && (
              <p className="text-xs text-gray-400 mb-6 bg-gray-50 px-3 py-1.5 rounded">
                {kycStatus === 'APPROVED' ? 'Approved' : 'Completed'} on:{' '}
                {new Date(kycApprovedAt || kycSubmittedAt).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => router.push('/user-dashboard')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150 shadow-sm"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {kycStatus === 'REJECTED' && (
          <>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 border border-red-100">
              <FileX size={40} />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Verification Rejected</h2>
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm text-center max-w-md border border-red-100">
              <p className="font-semibold mb-1">Reason for Rejection:</p>
              <p className="italic text-gray-700">
                "{kycRejectionReason || 'No reason provided by the administrator.'}"
              </p>
            </div>
            {kycRejectedAt && (
              <p className="text-xs text-gray-400 mb-6 bg-gray-50 px-3 py-1.5 rounded">
                Reviewed on: {new Date(kycRejectedAt).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => router.push('/user-dashboard/kyc/complete')}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition duration-150 shadow-sm"
            >
              Complete Registration Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
