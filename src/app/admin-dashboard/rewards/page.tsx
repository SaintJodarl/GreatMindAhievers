'use client';

import React, { useEffect, useState } from 'react';

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function AdminRewardsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = () => {
    fetch('/api/admin/rewards')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reward records');
        return res.json();
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setClaims(d);
          setLoans([]);
        } else {
          setClaims(d.claims || []);
          setLoans(d.loans || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const updateClaimStatus = (claimId: string, status: string) => {
    const adminNote = prompt('Optional admin note:');
    fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId, status, adminNote }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update status');
        fetchClaims();
      })
      .catch((err) => alert(err.message));
  };

  const updateLoanStatus = (loan: any, status: string) => {
    const amountRepaid =
      status === 'REPAID'
        ? loan.totalRepayable
        : prompt('Amount repaid to date:', loan.amountRepaid?.toString() || '0');
    const adminNote = prompt('Optional admin note:');

    fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId: loan.id, status, amountRepaid, adminNote }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update loan');
        fetchClaims();
      })
      .catch((err) => alert(err.message));
  };

  if (loading) return <div className="p-6">Loading reward claims...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Stage Loans</h1>
        <p className="mt-1 text-sm text-gray-500">
          Process reward claims and administer repayable Jasper/Sapphire loan records.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Reward Claims</h2>
        </div>

        {claims.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No claims found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Stage / Reward</th>
                  <th className="px-4 py-3">Option</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(claim.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {claim.user.name} ({claim.user.username})
                      <br />
                      <span className="text-xs text-gray-500">{claim.user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {claim.reward.stageName || claim.reward.stage}
                      <br />
                      <span className="font-semibold text-green-700">
                        {formatMoney(claim.reward.rewardValue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{claim.selectedOption}</td>
                    <td className="px-4 py-3">
                      {claim.user.bankName ? (
                        <>
                          {claim.user.bankName}
                          <br />
                          {claim.user.accountNumber}
                          <br />
                          {claim.user.accountName}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {claim.status}
                      </span>
                      {claim.adminNote && (
                        <div className="mt-1 text-xs text-gray-500">Note: {claim.adminNote}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {claim.status === 'PENDING_ADMIN_PROCESSING' && (
                        <button
                          onClick={() => updateClaimStatus(claim.id, 'PROCESSING')}
                          className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                        >
                          Mark Processing
                        </button>
                      )}
                      {claim.status === 'PROCESSING' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              updateClaimStatus(
                                claim.id,
                                claim.selectedOption === 'CASH' ? 'PAID' : 'FULFILLED'
                              )
                            }
                            className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => updateClaimStatus(claim.id, 'REJECTED')}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Repayable Stage Loans</h2>
        </div>

        {loans.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No stage loans recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(loan.issuedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {loan.user.name} ({loan.user.username})
                      <br />
                      <span className="text-xs text-gray-500">{loan.user.email}</span>
                    </td>
                    <td className="px-4 py-3">{loan.stageName}</td>
                    <td className="px-4 py-3">{formatMoney(loan.principal)}</td>
                    <td className="px-4 py-3">{formatMoney(loan.interestAmount)}</td>
                    <td className="px-4 py-3">{formatMoney(loan.outstandingBalance)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateLoanStatus(loan, 'IN_REPAYMENT')}
                          className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                        >
                          In Repayment
                        </button>
                        <button
                          onClick={() => updateLoanStatus(loan, 'REPAID')}
                          className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        >
                          Mark Repaid
                        </button>
                        <button
                          onClick={() => updateLoanStatus(loan, 'DEFAULTED')}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                        >
                          Defaulted
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
