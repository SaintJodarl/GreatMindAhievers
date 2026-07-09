'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check } from 'lucide-react';
import { generateReferralLink } from '@/lib/referral-link';

export default function AdminOverviewClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.referralCode) {
      const link = generateReferralLink(user.referralCode);
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-2">My Admin Referral Link</h3>
        <p className="text-xs text-gray-500 mb-3">
          Share this link to register members directly under your admin account.
        </p>
        <div className="flex items-center gap-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 text-xs font-mono text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
            {user?.referralCode
              ? generateReferralLink(user.referralCode)
              : 'Loading...'}
          </div>
          <button
            onClick={handleCopy}
            disabled={!user?.referralCode}
            className="flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg transition-colors font-bold text-xs disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
