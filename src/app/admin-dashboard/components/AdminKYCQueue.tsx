'use client';

export default function AdminKYCQueue() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center py-16"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        No KYC applications pending
      </p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        KYC submissions from real members will appear here.
      </p>
    </div>
  );
}
