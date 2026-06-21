'use client';
import React, { useState } from 'react';

const referrals = [
  {
    id: 'ref-001',
    name: 'Chidinma Obi',
    email: 'chidinma.obi@email.com',
    joinDate: 'Feb 3, 2026',
    position: 'Left',
    status: 'Active',
    volume: 8420,
    commission: 50,
  },
  {
    id: 'ref-002',
    name: 'Tunde Bakare',
    email: 'tunde.bakare@email.com',
    joinDate: 'Feb 18, 2026',
    position: 'Right',
    status: 'Active',
    volume: 6180,
    commission: 50,
  },
  {
    id: 'ref-003',
    name: 'Ngozi Adeyemi',
    email: 'ngozi.adeyemi@email.com',
    joinDate: 'Mar 5, 2026',
    position: 'Left',
    status: 'Active',
    volume: 3240,
    commission: 50,
  },
  {
    id: 'ref-004',
    name: 'Ifeanyi Chukwu',
    email: 'ifeanyi.c@email.com',
    joinDate: 'Mar 19, 2026',
    position: 'Right',
    status: 'Active',
    volume: 2100,
    commission: 50,
  },
  {
    id: 'ref-005',
    name: 'Amaka Eze',
    email: 'amaka.eze@email.com',
    joinDate: 'Apr 2, 2026',
    position: 'Left',
    status: 'Pending KYC',
    volume: 0,
    commission: 0,
  },
  {
    id: 'ref-006',
    name: 'Kelechi Eze',
    email: 'kelechi.eze@email.com',
    joinDate: 'Apr 10, 2026',
    position: 'Right',
    status: 'Active',
    volume: 980,
    commission: 50,
  },
  {
    id: 'ref-007',
    name: 'Funmi Adesanya',
    email: 'funmi.a@email.com',
    joinDate: 'Apr 22, 2026',
    position: 'Left',
    status: 'Active',
    volume: 420,
    commission: 50,
  },
  {
    id: 'ref-008',
    name: 'Segun Oladele',
    email: 'segun.o@email.com',
    joinDate: 'Apr 28, 2026',
    position: 'Right',
    status: 'Pending KYC',
    volume: 0,
    commission: 0,
  },
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
        className="p-6 rounded-xl bg-white border border-slate-200/60 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Your Referral Link
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Share this link to earn ₦50,000 per direct referral + binary volume credits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-4 py-2.5 rounded-lg text-sm font-mono flex-1 sm:flex-none sm:min-w-[280px] bg-slate-50 border border-slate-200 text-slate-600"
            >
              {referralLink}
            </div>
            <button onClick={handleCopy} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm text-sm flex-shrink-0 flex items-center gap-1.5">
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7l4 4 6-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M9 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h1"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 gap-6 mt-6 pt-5 border-t border-slate-100"
        >
          {[
            { label: 'Direct Referrals', value: '28', color: 'var(--primary)' },
            { label: 'Total Referral Bonus', value: '₦1,400,000', color: 'var(--accent)' },
            { label: 'Conversion Rate', value: '68%', color: 'var(--info)' },
          ]?.map((stat) => (
            <div key={`refstat-${stat?.label}`} className="text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {stat?.value}
              </p>
              <p className="text-[13px] mt-1 text-slate-500 font-medium">
                {stat?.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Direct referrals table */}
      <div
        className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            Direct Referrals ({referrals?.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60">
                {['Member', 'Join Date', 'Position', 'Volume (PV)', 'Bonus Earned', 'Status']?.map(
                  (h) => (
                    <th
                      key={`rth-${h}`}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {referrals?.map((r, i) => (
                <tr
                  key={r?.id}
                  className="border-b transition-colors hover:bg-slate-50/50 border-slate-100"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        {r?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {r?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                    {r?.joinDate}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        r?.position === 'Left'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {r?.position} Leg
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                    {r?.volume > 0 ? `${r?.volume?.toLocaleString()} PV` : '—'}
                  </td>
                  <td className={`px-5 py-4 text-sm font-bold ${r?.commission > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {r?.commission > 0 ? `+₦${(r?.commission * 1000)?.toLocaleString()}` : '₦0'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        r?.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
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
