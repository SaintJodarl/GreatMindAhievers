'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface KYCStatusCardProps {
  kycStatus?: string;
  kycSubmittedAt?: string | null;
  kycApprovedAt?: string | null;
  kycRejectedAt?: string | null;
  kycRejectionReason?: string | null;
}

export default function KYCStatusCard({
  kycStatus = 'PENDING',
  kycSubmittedAt,
  kycApprovedAt,
  kycRejectedAt,
  kycRejectionReason,
}: KYCStatusCardProps) {
  const router = useRouter();
  const isComplete = kycStatus === 'COMPLETE';
  const isApproved = kycStatus === 'APPROVED';
  const isSubmitted = kycStatus === 'SUBMITTED';
  const isRejected = kycStatus === 'REJECTED';

  const displayStatus = isApproved
    ? 'Approved'
    : isComplete
      ? 'Complete'
      : isSubmitted
        ? 'Under Review'
        : isRejected
          ? 'Rejected'
          : 'Not Submitted';

  const tone = isApproved || isComplete
    ? {
        color: 'var(--accent)',
        bg: 'rgba(16,217,160,0.08)',
        border: 'rgba(16,217,160,0.25)',
        icon: <CheckCircle2 size={16} />,
      }
    : isRejected
      ? {
          color: 'var(--negative)',
          bg: 'rgba(255,77,106,0.08)',
          border: 'rgba(255,77,106,0.25)',
          icon: <XCircle size={16} />,
        }
      : {
          color: 'var(--warning)',
          bg: 'rgba(245,158,11,0.08)',
          border: 'rgba(245,158,11,0.25)',
          icon: <Clock size={16} />,
        };

  const message = isApproved
    ? 'Your identity has been verified. All platform features are unlocked.'
    : isComplete
      ? 'Your registration details are complete. Account activation remains separate.'
      : isSubmitted
        ? kycSubmittedAt
          ? `Registration submitted on ${new Date(kycSubmittedAt).toLocaleDateString()}.`
          : 'Registration submitted and awaiting review.'
        : isRejected
          ? kycRejectionReason
            ? `Rejection reason: ${kycRejectionReason}.`
            : 'Please complete registration again.'
          : 'Complete registration to save your personal and banking information.';

  return (
    <div
      className="p-5 rounded-xl h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          Registration Status
        </h3>
        <span
          className="badge inline-flex items-center gap-1"
          style={{
            background: tone.bg,
            color: tone.color,
            border: `1px solid ${tone.border}`,
          }}
        >
          {tone.icon} {displayStatus}
        </span>
      </div>

      <div
        className="p-3 rounded-lg mb-4 text-xs leading-relaxed"
        style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color }}
      >
        {message}
      </div>

      {(isComplete || isApproved) && (
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isApproved && kycApprovedAt
            ? `Approved on ${new Date(kycApprovedAt).toLocaleDateString()}`
            : kycSubmittedAt
              ? `Completed on ${new Date(kycSubmittedAt).toLocaleDateString()}`
              : 'Completed'}
        </div>
      )}

      {isRejected && kycRejectedAt && (
        <div className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Reviewed on {new Date(kycRejectedAt).toLocaleDateString()}
        </div>
      )}

      {(kycStatus === 'PENDING' || isRejected) && (
        <button
          onClick={() => router.push('/user-dashboard/kyc/complete')}
          className="btn-primary w-full text-sm"
        >
          Complete Registration
        </button>
      )}
    </div>
  );
}
