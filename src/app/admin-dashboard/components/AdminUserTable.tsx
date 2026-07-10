'use client';

export default function AdminUserTable() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="py-16 text-center">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          No members found
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Member records will appear here after real registrations begin.
        </p>
      </div>
    </div>
  );
}
