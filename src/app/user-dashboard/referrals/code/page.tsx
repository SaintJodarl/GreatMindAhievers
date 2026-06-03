import React from 'react';
import { QrCode } from 'lucide-react';

export const metadata = {
  title: 'Referral Code | Referral Center',
};

export default function ReferralCodePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referral Code</h1>
        <p className="text-gray-500 mt-1">Your unique code for manual registrations.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm flex flex-col items-center text-center">
        <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
          <QrCode size={64} className="text-gray-400" />
        </div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">Your Code</h2>
        <p className="text-3xl font-black text-indigo-600 tracking-wider font-mono">GMA-MBR1</p>
        <p className="text-sm text-gray-500 mt-4">
          Members can enter this code manually during their registration process.
        </p>
      </div>
    </div>
  );
}
