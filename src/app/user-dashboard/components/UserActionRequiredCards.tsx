'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, KeyRound, CheckCircle2, ChevronRight } from 'lucide-react';

interface UserActionRequiredCardsProps {
  summary: any;
  onOpenAction: (step: number) => void;
}

export default function UserActionRequiredCards({ summary, onOpenAction }: UserActionRequiredCardsProps) {
  const isKycComplete = summary.kycStatus === 'APPROVED';
  const isActivated = summary.status === 'ACTIVE';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* KYC Status Card */}
      <div
        className={`rounded-xl border p-5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          isKycComplete
            ? 'bg-emerald-50/40 border-emerald-200/60'
            : 'bg-amber-50/40 border-amber-200/60'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isKycComplete ? 'bg-emerald-100/50 text-emerald-600' : 'bg-amber-100/50 text-amber-600'
            }`}
          >
            {isKycComplete ? <ShieldCheck size={24} strokeWidth={2.5} /> : <ShieldAlert size={24} strokeWidth={2.5} />}
          </div>
          <div>
            <h3
              className={`text-base font-bold ${
                isKycComplete ? 'text-emerald-900' : 'text-amber-950'
              }`}
            >
              {isKycComplete ? 'KYC Verified' : 'KYC Verification Incomplete'}
            </h3>
            <p
              className={`text-[13px] mt-1 font-medium ${
                isKycComplete ? 'text-emerald-700/80' : 'text-amber-800/80'
              }`}
            >
              {isKycComplete
                ? 'Your identity has been fully verified. All features are unlocked.'
                : 'Submit your identity documents to unlock withdrawals and full features.'}
            </p>
          </div>
        </div>

        {!isKycComplete && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => onOpenAction(1)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              Complete KYC Now
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Activation Status Card */}
      <div
        className={`rounded-xl border p-5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          isActivated
            ? 'bg-emerald-50/40 border-emerald-200/60'
            : 'bg-blue-50/40 border-blue-200/60'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isActivated ? 'bg-emerald-100/50 text-emerald-600' : 'bg-blue-100/50 text-blue-600'
            }`}
          >
            {isActivated ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <KeyRound size={24} strokeWidth={2.5} />}
          </div>
          <div>
            <h3
              className={`text-base font-bold ${
                isActivated ? 'text-emerald-900' : 'text-blue-950'
              }`}
            >
              {isActivated ? 'Account Activated' : 'Activate Your Account'}
            </h3>
            <p
              className={`text-[13px] mt-1 font-medium ${
                isActivated ? 'text-emerald-700/80' : 'text-blue-800/80'
              }`}
            >
              {isActivated
                ? 'Your account is active and you are ready to earn.'
                : 'Enter your activation code from admin to unlock full access.'}
            </p>
          </div>
        </div>

        {!isActivated && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => onOpenAction(5)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              Activate Now
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
