'use client';
import React from 'react';
import ReferralLinkCard from './ReferralLinkCard';

interface ReferralSectionProps {
  initialReferrals?: any[];
  summary?: any;
}

export default function ReferralSection({ initialReferrals = [], summary }: ReferralSectionProps) {
  const referralCode = summary?.referralCode || 'YOUR-CODE';

  return (
    <div className="space-y-5">
      {/* Referral link card */}
      <ReferralLinkCard referralCode={referralCode} />

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>
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
                          <p className="text-sm font-bold text-slate-700">
                            {ref.name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-slate-500">{ref.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                      {new Date(ref.createdAt || new Date()).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                          ref.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
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
