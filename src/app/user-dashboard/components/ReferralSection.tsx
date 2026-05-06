'use client';
import React, { useState } from 'react';

const referrals = [
  { id: 'ref-001', name: 'Chidinma Obi', email: 'chidinma.obi@email.com', joinDate: 'Feb 3, 2026', position: 'Left', status: 'Active', volume: 8420, commission: 50 },
  { id: 'ref-002', name: 'Tunde Bakare', email: 'tunde.bakare@email.com', joinDate: 'Feb 18, 2026', position: 'Right', status: 'Active', volume: 6180, commission: 50 },
  { id: 'ref-003', name: 'Ngozi Adeyemi', email: 'ngozi.adeyemi@email.com', joinDate: 'Mar 5, 2026', position: 'Left', status: 'Active', volume: 3240, commission: 50 },
  { id: 'ref-004', name: 'Ifeanyi Chukwu', email: 'ifeanyi.c@email.com', joinDate: 'Mar 19, 2026', position: 'Right', status: 'Active', volume: 2100, commission: 50 },
  { id: 'ref-005', name: 'Amaka Eze', email: 'amaka.eze@email.com', joinDate: 'Apr 2, 2026', position: 'Left', status: 'Pending KYC', volume: 0, commission: 0 },
  { id: 'ref-006', name: 'Kelechi Eze', email: 'kelechi.eze@email.com', joinDate: 'Apr 10, 2026', position: 'Right', status: 'Active', volume: 980, commission: 50 },
  { id: 'ref-007', name: 'Funmi Adesanya', email: 'funmi.a@email.com', joinDate: 'Apr 22, 2026', position: 'Left', status: 'Active', volume: 420, commission: 50 },
  { id: 'ref-008', name: 'Segun Oladele', email: 'segun.o@email.com', joinDate: 'Apr 28, 2026', position: 'Right', status: 'Pending KYC', volume: 0, commission: 0 },
];

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'GMA-00142';
  const referralLink = `https://gma.network/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Referral link card */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(108,71,255,0.12) 0%, rgba(16,217,160,0.06) 100%)',
          border: '1px solid rgba(108,71,255,0.25)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Your Referral Link
            </h3>
            <p className="text-xs" style={{ color: 'var(--secondary-foreground)' }}>
              Share this link to earn ₦50,000 per direct referral + binary volume credits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-2 rounded-lg text-xs font-mono-nums flex-1 sm:flex-none sm:min-w-[280px]"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)' }}
            >
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="btn-primary px-3 py-2 text-xs flex-shrink-0"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M9 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t" style={{ borderColor: 'rgba(108,71,255,0.2)' }}>
          {[
            { label: 'Direct Referrals', value: '28', color: 'var(--primary)' },
            { label: 'Total Referral Bonus', value: '₦1,400,000', color: 'var(--accent)' },
            { label: 'Conversion Rate', value: '68%', color: 'var(--info)' },
          ]?.map((stat) => (
            <div key={`refstat-${stat?.label}`} className="text-center">
              <p className="text-xl font-bold font-mono-nums" style={{ color: stat?.color }}>{stat?.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{stat?.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Direct referrals table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Direct Referrals ({referrals?.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Member', 'Join Date', 'Position', 'Volume (PV)', 'Bonus Earned', 'Status']?.map((h) => (
                  <th
                    key={`rth-${h}`}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals?.map((r, i) => (
                <tr
                  key={r?.id}
                  className="border-b transition-colors hover:bg-muted/40"
                  style={{
                    borderColor: 'var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)' }}
                      >
                        {r?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{r?.name}</p>
                        <p className="text-xs font-mono-nums" style={{ color: 'var(--muted-foreground)' }}>{r?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono-nums" style={{ color: 'var(--secondary-foreground)' }}>
                    {r?.joinDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="badge text-xs"
                      style={
                        r?.position === 'Left'
                          ? { background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }
                          : { background: 'rgba(56,189,248,0.1)', color: 'var(--info)' }
                      }
                    >
                      {r?.position} Leg
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono-nums font-semibold" style={{ color: 'var(--foreground)' }}>
                    {r?.volume > 0 ? `${r?.volume?.toLocaleString()} PV` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono-nums font-bold" style={{ color: r?.commission > 0 ? 'var(--accent)' : 'var(--muted-foreground)' }}>
                    {r?.commission > 0 ? `+₦${(r?.commission * 1000)?.toLocaleString()}` : '₦0'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r?.status === 'Active' ? 'badge-active' : 'badge-pending'}`}>
                      {r?.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}