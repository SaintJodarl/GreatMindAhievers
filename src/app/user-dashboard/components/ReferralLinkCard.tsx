'use client';
import React, { useState } from 'react';
import { generateReferralLink } from '@/lib/referral-link';

interface ReferralLinkCardProps {
  referralCode?: string;
}

export default function ReferralLinkCard({ referralCode = 'YOUR-CODE' }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = generateReferralLink(referralCode);

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-5 md:p-6 rounded-xl bg-white border border-slate-200 shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your Referral Link</h3>
          <p className="text-xs text-slate-500 font-medium break-words leading-relaxed">
            Share your registration invite link with new members to grow your downline.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto max-w-full">
          <div className="px-3 md:px-4 py-2.5 rounded-lg text-[13px] md:text-sm font-mono flex-1 min-w-0 bg-slate-50 border border-slate-200 text-slate-600 truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm text-sm flex-shrink-0 flex items-center justify-center gap-1.5 border border-transparent"
          >
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
                  <rect
                    x="4"
                    y="4"
                    width="8"
                    height="8"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4 4V3C4 2.44772 4.44772 2 5 2H11C11.5523 2 12 2.44772 12 3V9C12 9.55228 11.5523 10 11 10H10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
