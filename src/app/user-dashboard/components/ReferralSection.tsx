'use client';
import React, { useState } from 'react';

interface ReferralSectionProps {
  initialReferrals?: any[];
  summary?: any;
}

export default function ReferralSection({ initialReferrals = [], summary }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const referralCode = summary?.referralCode || 'YOUR-CODE';
  const referralLink = `https://gma.network/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Referral link card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Your Referral Link
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Share this link to earn ₦50,000 per direct referral + binary volume credits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2.5 rounded-lg text-sm font-mono flex-1 sm:flex-none sm:min-w-[280px] bg-slate-50 border border-slate-200 text-slate-600">
              {referralLink}
            </div>
            <button onClick={handleCopy} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm text-sm flex-shrink-0 flex items-center gap-1.5">
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7l4 4 6-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 4V3C4 2.44772 4.44772 2 5 2H11C11.5523 2 12 2.44772 12 3V9C12 9.55228 11.5523 10 11 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Referrals list */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Direct Referrals</h3>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
            {initialReferrals.length} Total
          </span>
        </div>

        {initialReferrals.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-300 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">No direct referrals yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
              Share your referral link with friends and family to build your network.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {ref.name ? ref.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{ref.name || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-500">{ref.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                      {new Date(ref.createdAt || new Date()).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        ref.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ref.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
