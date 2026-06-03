import React from 'react';
import { FileCheck } from 'lucide-react';

export const metadata = {
  title: 'KYC Status | Verification',
};

export default function KycStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">KYC Status</h1>
        <p className="text-gray-500 mt-1">Check the current status of your identity verification.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <FileCheck size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
        <p className="text-gray-500 max-w-md text-center mb-6">
          You haven't submitted your KYC documents yet. Please complete your KYC to unlock all features including withdrawals.
        </p>
      </div>
    </div>
  );
}
