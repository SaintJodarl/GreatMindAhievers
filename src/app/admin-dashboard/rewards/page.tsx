'use client';

import React, { useEffect, useState } from 'react';

export default function AdminRewardsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = () => {
    fetch('/api/admin/rewards')
      .then((res) => res.json())
      .then((d) => {
        setClaims(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const updateClaimStatus = (claimId: string, status: string) => {
    const adminNote = prompt('Optional Admin Note:');
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

  if (loading) return <div className="p-6">Loading reward claims...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Process Reward Claims</h1>

      {claims.length === 0 ? (
        <p>No claims found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Member
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Stage / Reward
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Option
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Bank Details
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b text-sm">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
                    {claim.user.name} ({claim.user.username})<br />
                    <span className="text-xs text-gray-500">{claim.user.email}</span>
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
                    {claim.reward.stage} <br />
                    <span className="font-semibold text-green-600">
                      ₦{Number(claim.reward.rewardValue).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b text-sm font-bold text-indigo-600">
                    {claim.selectedOption}
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
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
                  <td className="px-4 py-2 border-b text-sm">
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium text-xs">
                      {claim.status}
                    </span>
                    {claim.adminNote && (
                      <div className="text-xs text-gray-500 mt-1">Note: {claim.adminNote}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
                    {claim.status === 'PENDING_ADMIN_PROCESSING' && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateClaimStatus(claim.id, 'PROCESSING')}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          Mark Processing
                        </button>
                      </div>
                    )}
                    {claim.status === 'PROCESSING' && (
                      <div className="flex flex-col gap-1">
                        {claim.selectedOption === 'CASH' && (
                          <button
                            onClick={() => updateClaimStatus(claim.id, 'PAID')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            Mark PAID
                          </button>
                        )}
                        {claim.selectedOption === 'FOOD' && (
                          <button
                            onClick={() => updateClaimStatus(claim.id, 'FULFILLED')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            Mark FULFILLED
                          </button>
                        )}
                        <button
                          onClick={() => updateClaimStatus(claim.id, 'REJECTED')}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
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
    </div>
  );
}
