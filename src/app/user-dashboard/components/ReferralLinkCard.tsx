'use client';
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
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
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <h3 className="mb-1 text-base font-bold text-slate-900">Your Referral Link</h3>
          <p className="max-w-prose text-sm font-medium leading-relaxed text-slate-500">
            Share your registration invite link with new members to grow your downline.
          </p>
        </div>
        <div className="flex min-w-0 w-full max-w-full flex-col gap-3">
          <div
            className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs leading-relaxed text-slate-600"
            title={referralLink}
          >
            <span className="block select-all break-words">{referralLink}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:self-start"
            aria-label={copied ? 'Referral link copied' : 'Copy referral link'}
          >
            {copied ? (
              <>
                <Check size={14} aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" />
                Copy Referral Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
