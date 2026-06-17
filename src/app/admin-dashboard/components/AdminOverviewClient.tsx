'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOverviewClient() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push('/admin-dashboard/codes')}
        className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-gray-100 font-semibold text-gray-700 block"
      >
        Generate Registration Codes
      </button>
      <button
        onClick={() => router.push('/admin-dashboard/withdrawals')}
        className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-gray-100 font-semibold text-gray-700 block"
      >
        Review Pending Withdrawals
      </button>
      <button
        onClick={() => router.push('/admin-dashboard/kyc')}
        className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-100 font-semibold text-gray-700 block"
      >
        Review KYC Submissions
      </button>
    </div>
  );
}
