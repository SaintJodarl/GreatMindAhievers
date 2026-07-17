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
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-base font-bold text-slate-900">Your Referral Link</h3>
          <p className="max-w-prose text-sm font-medium leading-relaxed text-slate-500">
            Share your registration invite link with new members to grow your downline.
          </p>
        </div>
        <div className="flex min-w-0 w-full max-w-full flex-col gap-2 min-[420px]:flex-row lg:max-w-xl">
          <div
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-600"
            title={referralLink}
          >
            <span className="block truncate">{referralLink}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={copied ? 'Referral link copied' : 'Copy referral link'}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2 7l4 4 6-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
