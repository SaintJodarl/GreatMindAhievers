'use client';
import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  memberId: string;
  sponsorId: string;
  position: 'Left' | 'Right';
  rank: string;
  leftVol: number;
  rightVol: number;
  walletBalance: number;
  kycStatus: 'Approved' | 'Under Review' | 'Rejected' | 'Not Submitted';
  accountStatus: 'Active' | 'Pending KYC' | 'Suspended';
  joinDate: string;
  state: string;
}

const users: User[] = [
  {
    id: 'usr-002',
    name: 'Chidinma Obi',
    email: 'chidinma.obi@email.com',
    memberId: 'GMA-00218',
    sponsorId: 'GMA-00142',
    position: 'Left',
    rank: 'Bronze',
    leftVol: 4200,
    rightVol: 4220,
    walletBalance: 1240000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Feb 3, 2026',
    state: 'Abuja',
  },
  {
    id: 'usr-003',
    name: 'Tunde Bakare',
    email: 'tunde.bakare@email.com',
    memberId: 'GMA-00267',
    sponsorId: 'GMA-00142',
    position: 'Right',
    rank: 'Bronze',
    leftVol: 3100,
    rightVol: 3080,
    walletBalance: 980000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Feb 18, 2026',
    state: 'Oyo',
  },
  {
    id: 'usr-004',
    name: 'Amaka Eze',
    email: 'amaka.eze@email.com',
    memberId: 'GMA-00389',
    sponsorId: 'GMA-00218',
    position: 'Right',
    rank: 'Entry',
    leftVol: 0,
    rightVol: 0,
    walletBalance: 0,
    kycStatus: 'Under Review',
    accountStatus: 'Pending KYC',
    joinDate: 'Apr 2, 2026',
    state: 'Enugu',
  },
  {
    id: 'usr-005',
    name: 'Emeka Nwosu',
    email: 'emeka.nwosu@email.com',
    memberId: 'GMA-00341',
    sponsorId: 'GMA-00218',
    position: 'Left',
    rank: 'Entry',
    leftVol: 1050,
    rightVol: 1050,
    walletBalance: 210000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Mar 15, 2026',
    state: 'Rivers',
  },
  {
    id: 'usr-006',
    name: 'Ngozi Adeyemi',
    email: 'ngozi.adeyemi@email.com',
    memberId: 'GMA-00412',
    sponsorId: 'GMA-00267',
    position: 'Left',
    rank: 'Entry',
    leftVol: 825,
    rightVol: 825,
    walletBalance: 165000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Mar 28, 2026',
    state: 'Kano',
  },
  {
    id: 'usr-007',
    name: 'Kelechi Eze',
    email: 'kelechi.eze@email.com',
    memberId: 'GMA-00445',
    sponsorId: 'GMA-00267',
    position: 'Right',
    rank: 'Entry',
    leftVol: 490,
    rightVol: 490,
    walletBalance: 98000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Apr 10, 2026',
    state: 'Edo',
  },
  {
    id: 'usr-008',
    name: 'Segun Oladele',
    email: 'segun.oladele@email.com',
    memberId: 'GMA-00502',
    sponsorId: 'GMA-00142',
    position: 'Right',
    rank: 'Entry',
    leftVol: 0,
    rightVol: 0,
    walletBalance: 0,
    kycStatus: 'Not Submitted',
    accountStatus: 'Pending KYC',
    joinDate: 'Apr 28, 2026',
    state: 'Ogun',
  },
  {
    id: 'usr-009',
    name: 'Funmi Adesanya',
    email: 'funmi.adesanya@email.com',
    memberId: 'GMA-00488',
    sponsorId: 'GMA-00341',
    position: 'Left',
    rank: 'Entry',
    leftVol: 210,
    rightVol: 210,
    walletBalance: 42000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Apr 22, 2026',
    state: 'Delta',
  },
  {
    id: 'usr-010',
    name: 'Biodun Lawal',
    email: 'biodun.lawal@email.com',
    memberId: 'GMA-00311',
    sponsorId: 'GMA-00001',
    position: 'Right',
    rank: 'Bronze',
    leftVol: 2800,
    rightVol: 2100,
    walletBalance: 560000,
    kycStatus: 'Rejected',
    accountStatus: 'Suspended',
    joinDate: 'Mar 1, 2026',
    state: 'Kaduna',
  },
  {
    id: 'usr-011',
    name: 'Ifeanyi Chukwu',
    email: 'ifeanyi.chukwu@email.com',
    memberId: 'GMA-00356',
    sponsorId: 'GMA-00218',
    position: 'Right',
    rank: 'Entry',
    leftVol: 630,
    rightVol: 630,
    walletBalance: 126000,
    kycStatus: 'Approved',
    accountStatus: 'Active',
    joinDate: 'Mar 22, 2026',
    state: 'Anambra',
  },
  {
    id: 'usr-012',
    name: 'Yetunde Balogun',
    email: 'yetunde.b@email.com',
    memberId: 'GMA-00378',
    sponsorId: 'GMA-00142',
    position: 'Left',
    rank: 'Entry',
    leftVol: 1050,
    rightVol: 1050,
    walletBalance: 210000,
    kycStatus: 'Under Review',
    accountStatus: 'Pending KYC',
    joinDate: 'Mar 19, 2026',
    state: 'Lagos',
  },
];

type ActionModal = { type: 'activate' | 'suspend' | 'view'; user: User } | null;

export default function AdminUserTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const perPage = 8;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.memberId.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    const matchKyc = kycFilter === 'all' || u.kycStatus === kycFilter;
    return matchSearch && matchStatus && matchKyc;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === paged.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paged.map((u) => u.id)));
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Toolbar */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="relative flex-1">
          <input
            className="input-field pl-8 pr-3 py-2 text-xs w-full"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex gap-2">
          <select
            className="input-field text-xs py-2 px-2.5"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending KYC">Pending KYC</option>
            <option value="Suspended">Suspended</option>
          </select>
          <select
            className="input-field text-xs py-2 px-2.5"
            value={kycFilter}
            onChange={(e) => {
              setKycFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All KYC</option>
            <option value="Approved">KYC Approved</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
            <option value="Not Submitted">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div
          className="px-4 py-2.5 flex items-center justify-between animate-slide-up"
          style={{
            background: 'rgba(108,71,255,0.1)',
            borderBottom: '1px solid rgba(108,71,255,0.2)',
          }}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            {selectedRows.size} member{selectedRows.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5">Activate Selected</button>
            <button className="btn-danger text-xs px-3 py-1.5">Suspend Selected</button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-xs px-2 py-1.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              <th className="px-4 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paged.length && paged.length > 0}
                  onChange={toggleAll}
                  style={{ accentColor: 'var(--primary)' }}
                />
              </th>
              {[
                'Member',
                'Member ID',
                'Sponsor',
                'Position',
                'Left Vol',
                'Right Vol',
                'Wallet',
                'KYC',
                'Status',
                'State',
                'Actions',
              ].map((h) => (
                <th
                  key={`ath-${h}`}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((user, i) => (
              <tr
                key={user.id}
                className="border-b transition-colors hover:bg-muted/40 group"
                style={{
                  borderColor: 'var(--border)',
                  background: selectedRows.has(user.id)
                    ? 'rgba(108,71,255,0.06)'
                    : i % 2 === 0
                      ? 'transparent'
                      : 'rgba(255,255,255,0.01)',
                }}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(user.id)}
                    onChange={() => toggleRow(user.id)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #10D9A0 100%)' }}
                    >
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                        {user.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-xs font-mono-nums font-semibold"
                  style={{ color: 'var(--primary)' }}
                >
                  {user.memberId}
                </td>
                <td
                  className="px-4 py-3 text-xs font-mono-nums"
                  style={{ color: 'var(--secondary-foreground)' }}
                >
                  {user.sponsorId}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="badge text-xs"
                    style={
                      user.position === 'Left'
                        ? { background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }
                        : { background: 'rgba(56,189,248,0.1)', color: 'var(--info)' }
                    }
                  >
                    {user.position}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-xs font-mono-nums"
                  style={{ color: 'var(--foreground)' }}
                >
                  {user.leftVol.toLocaleString()}
                </td>
                <td
                  className="px-4 py-3 text-xs font-mono-nums"
                  style={{ color: 'var(--foreground)' }}
                >
                  {user.rightVol.toLocaleString()}
                </td>
                <td
                  className="px-4 py-3 text-xs font-mono-nums font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  ₦{user.walletBalance.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      user.kycStatus === 'Approved'
                        ? 'badge-active'
                        : user.kycStatus === 'Under Review'
                          ? 'badge-pending'
                          : user.kycStatus === 'Rejected'
                            ? 'badge-rejected'
                            : 'badge-suspended'
                    }`}
                  >
                    {user.kycStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      user.accountStatus === 'Active'
                        ? 'badge-active'
                        : user.accountStatus === 'Pending KYC'
                          ? 'badge-pending'
                          : 'badge-suspended'
                    }`}
                  >
                    {user.accountStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {user.state}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setActionModal({ type: 'view', user })}
                      className="p-1.5 rounded-lg transition-colors hover:bg-muted"
                      title="View member details"
                      style={{ color: 'var(--info)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M1 6.5s2.5-4.5 5.5-4.5 5.5 4.5 5.5 4.5-2.5 4.5-5.5 4.5S1 6.5 1 6.5z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </button>
                    {user.accountStatus !== 'Active' ? (
                      <button
                        onClick={() => setActionModal({ type: 'activate', user })}
                        className="p-1.5 rounded-lg transition-colors hover:bg-muted"
                        title="Activate member account"
                        style={{ color: 'var(--accent)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path
                            d="M2 6.5l3.5 3.5 5.5-6"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionModal({ type: 'suspend', user })}
                        className="p-1.5 rounded-lg transition-colors hover:bg-muted"
                        title="Suspend member account"
                        style={{ color: 'var(--negative)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle
                            cx="6.5"
                            cy="6.5"
                            r="5.5"
                            stroke="currentColor"
                            strokeWidth="1.3"
                          />
                          <path
                            d="M4.5 4.5l4 4M8.5 4.5l-4 4"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              No members found
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between p-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–
          {Math.min(page * perPage, filtered.length)} of {filtered.length} members
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={`apage-${p}`}
              onClick={() => setPage(p)}
              className="w-7 h-7 rounded text-xs font-medium transition-all"
              style={
                page === p
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
              }
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Action modal */}
      {actionModal && <AdminActionModal modal={actionModal} onClose={() => setActionModal(null)} />}
    </div>
  );
}

function AdminActionModal({
  modal,
  onClose,
}: {
  modal: NonNullable<ActionModal>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    // Backend integration point: POST /api/admin/users/:id/status
    await new Promise((r) => setTimeout(r, 900));
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {modal.type === 'view' ? (
          <>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Member Details
            </h3>
            <div className="space-y-2">
              {[
                ['Member ID', modal.user.memberId],
                ['Full Name', modal.user.name],
                ['Email', modal.user.email],
                ['State', modal.user.state],
                ['Sponsor', modal.user.sponsorId],
                ['Position', modal.user.position + ' Leg'],
                ['Rank', modal.user.rank],
                ['KYC Status', modal.user.kycStatus],
                ['Account Status', modal.user.accountStatus],
                ['Join Date', modal.user.joinDate],
                ['Left Volume', `${modal.user.leftVol.toLocaleString()} PV`],
                ['Right Volume', `${modal.user.rightVol.toLocaleString()} PV`],
                ['Wallet Balance', `₦${modal.user.walletBalance.toLocaleString()}`],
              ].map(([k, v]) => (
                <div
                  key={`detail-${k}`}
                  className="flex justify-between text-xs py-1.5 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span style={{ color: 'var(--muted-foreground)' }}>{k}</span>
                  <span
                    className="font-medium font-mono-nums"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="btn-secondary w-full mt-4 text-sm">
              Close
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    modal.type === 'suspend' ? 'rgba(255,77,106,0.1)' : 'rgba(16,217,160,0.1)',
                }}
              >
                <span style={{ fontSize: 18 }}>{modal.type === 'suspend' ? '⛔' : '✅'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  {modal.type === 'suspend' ? 'Suspend Account' : 'Activate Account'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {modal.user.name} · {modal.user.memberId}
                </p>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--secondary-foreground)' }}>
              {modal.type === 'suspend'
                ? 'This will prevent the member from logging in, earning commissions, or requesting withdrawals. This action can be reversed.'
                : 'This will restore full platform access for this member, including commissions and withdrawals.'}
            </p>
            {done ? (
              <div className="text-center py-2" style={{ color: 'var(--accent)' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mx-auto mb-1"
                >
                  <path
                    d="M4 12l6 6 10-10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm font-medium">Done</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 text-sm ${modal.type === 'suspend' ? 'btn-danger' : 'btn-accent'}`}
                >
                  {loading ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="animate-spin mx-auto"
                    >
                      <circle
                        cx="7"
                        cy="7"
                        r="5.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeOpacity="0.3"
                      />
                      <path
                        d="M7 1.5A5.5 5.5 0 0112.5 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : modal.type === 'suspend' ? (
                    'Confirm Suspend'
                  ) : (
                    'Confirm Activate'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
