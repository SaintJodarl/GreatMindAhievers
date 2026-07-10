'use client';

export default function AdminWithdrawalApprovals() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approvals', value: '0', color: 'var(--warning)' },
          { label: 'Total Pending Value', value: 'NGN 0', color: 'var(--negative)' },
          { label: 'Approved Today', value: '0', color: 'var(--accent)' },
        ].map((summary) => (
          <div
            key={`wrsummary-${summary.label}`}
            className="p-4 rounded-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              {summary.label}
            </p>
            <p className="text-2xl font-bold font-mono-nums" style={{ color: summary.color }}>
              {summary.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl flex flex-col items-center justify-center py-16"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          No pending withdrawal requests
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Real member withdrawals will appear here.
        </p>
      </div>
    </div>
  );
}
