import React from 'react';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Direct Referrals | My Network',
};

export default function DirectReferralsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Direct Referrals</h1>
        <p className="text-gray-500 mt-1">View members you have personally sponsored.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <Users size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Direct Referrals</h2>
        <p className="text-gray-500 max-w-md text-center mb-6">
          You haven't sponsored anyone yet. Start sharing your referral link to grow your network!
        </p>
        <button className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          Get Referral Link
        </button>
      </div>
    </div>
  );
}
