'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface KYCApplication {
  id: string;
  memberId: string;
  name: string;
  email: string;
  state: string;
  submitDate: string;
  documents: { type: string; fileName: string; flagged: boolean }[];
  status: 'Under Review' | 'Approved' | 'Rejected';
  adminNote: string;
}

const kycApplications: KYCApplication[] = [
  { id: 'kyc-001', memberId: 'GMA-00389', name: 'Amaka Eze', email: 'amaka.eze@email.com', state: 'Enugu', submitDate: 'Apr 28, 2026', documents: [{ type: 'National ID (NIN)', fileName: 'amaka_nin.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'amaka_utility.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'amaka_selfie.jpg', flagged: true }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-002', memberId: 'GMA-00378', name: 'Yetunde Balogun', email: 'yetunde.b@email.com', state: 'Lagos', submitDate: 'Apr 27, 2026', documents: [{ type: 'Voter\'s Card (PVC)', fileName: 'yetunde_pvc.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'yetunde_bank.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'yetunde_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-003', memberId: 'GMA-00521', name: 'Chukwuemeka Ibe', email: 'chukwuemeka.i@email.com', state: 'Abuja', submitDate: 'Apr 26, 2026', documents: [{ type: 'National ID (NIN)', fileName: 'chukwuemeka_nin.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'chukwuemeka_bill.jpg', flagged: true }, { type: 'Selfie with ID', fileName: 'chukwuemeka_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-004', memberId: 'GMA-00534', name: 'Oluwaseun Adebisi', email: 'oluwaseun.a@email.com', state: 'Oyo', submitDate: 'Apr 25, 2026', documents: [{ type: 'Driver\'s License', fileName: 'oluwaseun_license.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'oluwaseun_utility.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'oluwaseun_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-005', memberId: 'GMA-00548', name: 'Blessing Okeke', email: 'blessing.okeke@email.com', state: 'Anambra', submitDate: 'Apr 24, 2026', documents: [{ type: 'Voter\'s Card (PVC)', fileName: 'blessing_pvc.jpg', flagged: true }, { type: 'Proof of Address', fileName: 'blessing_bill.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'blessing_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-006', memberId: 'GMA-00556', name: 'Chidi Okonkwo', email: 'chidi.okonkwo@email.com', state: 'Rivers', submitDate: 'Apr 23, 2026', documents: [{ type: 'International Passport', fileName: 'chidi_passport.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'chidi_bank.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'chidi_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
  { id: 'kyc-007', memberId: 'GMA-00562', name: 'Adaeze Nwachukwu', email: 'adaeze.n@email.com', state: 'Imo', submitDate: 'Apr 22, 2026', documents: [{ type: 'National ID (NIN)', fileName: 'adaeze_nin.jpg', flagged: false }, { type: 'Proof of Address', fileName: 'adaeze_utility.jpg', flagged: false }, { type: 'Selfie with ID', fileName: 'adaeze_selfie.jpg', flagged: false }], status: 'Under Review', adminNote: '' },
];

interface ReviewFormData {
  decision: 'approve' | 'reject';
  note: string;
}

export default function AdminKYCQueue() {
  const [selectedKYC, setSelectedKYC] = useState<KYCApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ReviewFormData>();
  const decision = watch('decision');

  const pending = kycApplications.filter((k) => !processedIds.has(k.id));
  const flaggedCount = pending.filter((k) => k.documents.some((d) => d.flagged)).length;

  // Backend integration point: POST /api/admin/kyc/:id/review
  const onSubmit = async (data: ReviewFormData) => {
    if (!selectedKYC) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessedIds((prev) => new Set([...prev, selectedKYC.id]));
    setSelectedKYC(null);
    reset();
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Queue list */}
      <div
        className="xl:col-span-1 rounded-xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              KYC Review Queue
            </h3>
            <div className="flex items-center gap-2">
              {flaggedCount > 0 && (
                <span
                  className="badge badge-rejected text-xs"
                >
                  {flaggedCount} flagged
                </span>
              )}
              <span className="badge badge-pending text-xs">{pending.length} pending</span>
            </div>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {pending.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="text-3xl mb-3">🎉</div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Queue cleared!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All KYC applications have been reviewed.</p>
            </div>
          ) : (
            pending.map((app) => {
              const hasFlagged = app.documents.some((d) => d.flagged);
              const isSelected = selectedKYC?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedKYC(app)}
                  className="p-4 cursor-pointer transition-all duration-150"
                  style={{
                    background: isSelected
                      ? 'rgba(108,71,255,0.1)'
                      : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)' }}
                      >
                        {app.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{app.name}</p>
                        <p className="text-xs font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>{app.memberId}</p>
                      </div>
                    </div>
                    {hasFlagged && (
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--warning)' }}>⚠</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{app.state} State</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{app.submitDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review panel */}
      <div className="xl:col-span-2">
        {!selectedKYC ? (
          <div
            className="h-full rounded-xl flex flex-col items-center justify-center py-16"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Select a KYC Application
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Click any application in the queue to review documents and make a decision.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden animate-fade-in"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  Reviewing: {selectedKYC.name}
                </h3>
                <p className="text-xs font-mono-nums mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {selectedKYC.memberId} · {selectedKYC.state} State · Submitted {selectedKYC.submitDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedKYC(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Documents */}
              <div>
                <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Submitted Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedKYC.documents.map((doc) => (
                    <div
                      key={`doc-${doc.type}`}
                      className="p-3 rounded-lg"
                      style={{
                        background: doc.flagged ? 'rgba(245,158,11,0.08)' : 'var(--muted)',
                        border: `1px solid ${doc.flagged ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{doc.type}</p>
                        {doc.flagged && (
                          <span className="text-xs" style={{ color: 'var(--warning)' }}>⚠ Flagged</span>
                        )}
                      </div>
                      {/* Simulated document preview */}
                      <div
                        className="w-full h-24 rounded-lg flex items-center justify-center mb-2"
                        style={{ background: 'var(--background)' }}
                      >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--muted-foreground)' }}>
                          <rect x="5" y="3" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M9 9h10M9 13h10M9 17h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{doc.fileName}</p>
                      <button
                        className="mt-2 text-xs font-medium hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        View Full Size ↗
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                    Review Decision
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'approve', label: 'Approve KYC', color: 'var(--accent)', bg: 'rgba(16,217,160,0.08)', border: 'rgba(16,217,160,0.3)' },
                      { value: 'reject', label: 'Reject KYC', color: 'var(--negative)', bg: 'rgba(255,77,106,0.08)', border: 'rgba(255,77,106,0.3)' },
                    ].map((opt) => {
                      const isSelected = decision === opt.value;
                      return (
                        <label
                          key={`decision-${opt.value}`}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150"
                          style={{
                            background: isSelected ? opt.bg : 'var(--muted)',
                            border: `1px solid ${isSelected ? opt.border : 'var(--border)'}`,
                          }}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            className="sr-only"
                            {...register('decision', { required: 'Select a decision' })}
                          />
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: isSelected ? opt.color : 'var(--border)' }}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: opt.color }} />}
                          </div>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: isSelected ? opt.color : 'var(--secondary-foreground)' }}
                          >
                            {opt.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.decision && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.decision.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                    {decision === 'reject' ? 'Rejection Reason (Required)' : 'Admin Note (Optional)'}
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder={
                      decision === 'reject' ?'Explain clearly why this KYC was rejected and what the member needs to resubmit...' :'Optional note for internal records...'
                    }
                    {...register('note', {
                      validate: (val) => {
                        if (decision === 'reject' && !val?.trim()) return 'Rejection reason is required';
                        return true;
                      },
                    })}
                  />
                  {errors.note && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.note.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedKYC(null); reset(); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 ${decision === 'reject' ? 'btn-danger' : 'btn-accent'}`}
                  >
                    {isSubmitting ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin mx-auto">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                        <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : decision === 'reject' ? 'Submit Rejection' : 'Approve KYC'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}