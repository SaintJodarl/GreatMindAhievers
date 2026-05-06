'use client';
import React, { useState } from 'react';

export default function KYCStatusCard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const kycStatus = 'Approved'; // Options: 'Not Submitted' | 'Under Review' | 'Approved' | 'Rejected'

  const statusConfig = {
    'Approved': {
      color: 'var(--accent)',
      bg: 'rgba(16,217,160,0.08)',
      border: 'rgba(16,217,160,0.25)',
      icon: '✓',
      message: 'Your identity has been verified. All platform features are unlocked.',
    },
    'Under Review': {
      color: 'var(--warning)',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.25)',
      icon: '⏳',
      message: 'Documents submitted on Apr 10, 2026. Review typically takes 24–48 hours.',
    },
    'Rejected': {
      color: 'var(--negative)',
      bg: 'rgba(255,77,106,0.08)',
      border: 'rgba(255,77,106,0.25)',
      icon: '✗',
      message: 'Rejection reason: Selfie photo was blurry. Please re-upload a clear photo.',
    },
    'Not Submitted': {
      color: 'var(--muted-foreground)',
      bg: 'rgba(107,114,128,0.08)',
      border: 'rgba(107,114,128,0.2)',
      icon: '○',
      message: 'Complete KYC verification to enable withdrawals and unlock higher commission tiers.',
    },
  };

  const config = statusConfig?.[kycStatus];

  const documents = [
    { label: 'Government ID', status: kycStatus === 'Approved' ? 'Verified' : 'Uploaded', date: 'Apr 10, 2026' },
    { label: 'Proof of Address', status: kycStatus === 'Approved' ? 'Verified' : 'Uploaded', date: 'Apr 10, 2026' },
    { label: 'Selfie with ID', status: kycStatus === 'Rejected' ? 'Rejected' : kycStatus === 'Approved' ? 'Verified' : 'Uploaded', date: 'Apr 10, 2026' },
  ];

  return (
    <div
      className="p-5 rounded-xl h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          KYC Verification
        </h3>
        <span
          className="badge"
          style={{ background: config?.bg, color: config?.color, border: `1px solid ${config?.border}` }}
        >
          {config?.icon} {kycStatus}
        </span>
      </div>
      <div
        className="p-3 rounded-lg mb-4 text-xs leading-relaxed"
        style={{ background: config?.bg, border: `1px solid ${config?.border}`, color: config?.color }}
      >
        {config?.message}
      </div>
      {/* Document checklist */}
      <div className="space-y-2 mb-4">
        {documents?.map((doc) => (
          <div
            key={`doc-${doc?.label}`}
            className="flex items-center justify-between py-2 border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    doc?.status === 'Verified'
                      ? 'rgba(16,217,160,0.15)'
                      : doc?.status === 'Rejected' ?'rgba(255,77,106,0.15)' :'rgba(245,158,11,0.15)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{
                    color:
                      doc?.status === 'Verified'
                        ? 'var(--accent)'
                        : doc?.status === 'Rejected' ?'var(--negative)' :'var(--warning)',
                  }}
                >
                  {doc?.status === 'Verified' ? (
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  ) : doc?.status === 'Rejected' ? (
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  ) : (
                    <circle cx="5" cy="5" r="2" fill="currentColor" />
                  )}
                </svg>
              </div>
              <span className="text-xs" style={{ color: 'var(--secondary-foreground)' }}>{doc?.label}</span>
            </div>
            <div className="text-right">
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    doc?.status === 'Verified'
                      ? 'var(--accent)'
                      : doc?.status === 'Rejected' ?'var(--negative)' :'var(--warning)',
                }}
              >
                {doc?.status}
              </span>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{doc?.date}</p>
            </div>
          </div>
        ))}
      </div>
      {(kycStatus === 'Not Submitted' || kycStatus === 'Rejected') && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary w-full text-sm"
        >
          {kycStatus === 'Rejected' ? 'Re-upload Documents' : 'Start KYC Verification'}
        </button>
      )}
      {kycStatus === 'Approved' && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--accent)' }}>
            <path d="M6 1L1.5 3.5v3C1.5 9.5 3.5 11.5 6 12c2.5-.5 4.5-2.5 4.5-5.5v-3L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          Verified on Apr 12, 2026 · Valid indefinitely
        </div>
      )}
    </div>
  );
}