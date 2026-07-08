'use client';

import React, { useEffect, useState } from 'react';

export default function MemberRewardsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = () => {
    fetch('/api/user/rewards')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleClaim = (rewardId: string, option: 'CASH' | 'FOOD') => {
    setSubmitting(rewardId);
    fetch('/api/user/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, selectedOption: option }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to claim reward');
        fetchRewards();
      })
      .catch((err) => alert(err.message))
      .finally(() => setSubmitting(null));
  };

  if (loading) return <div className="p-6">Loading rewards...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Rewards & Stage Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {data?.progress?.map((p: any) => (
          <div key={p.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">{p.stage}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Status: <span className="font-medium text-indigo-600">{p.status}</span>
            </p>
            <div className="flex justify-between text-sm">
              <span>Left Leg: {p.leftQualifiedCount} qualified</span>
              <span>Right Leg: {p.rightQualifiedCount} qualified</span>
            </div>
            {p.status === 'COMPLETED' && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Completed on {new Date(p.qualifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-800">Earned Rewards</h2>
      {data?.rewards?.length === 0 && <p className="text-gray-500">No rewards earned yet.</p>}

      <div className="grid grid-cols-1 gap-6">
        {data?.rewards?.map((r: any) => (
          <div
            key={r.id}
            className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-800">{r.stage} Reward</h3>
              <p className="text-xl text-green-600 font-semibold mb-2">
                ₦{Number(r.rewardValue).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 max-w-xl">{r.rewardPackage}</p>
              <p className="text-sm mt-2 font-medium">Status: {r.status}</p>

              {r.claims?.length > 0 && (
                <div className="mt-2 text-sm text-indigo-700 bg-indigo-50 p-2 rounded">
                  Claim Request: {r.claims[0].selectedOption} - Status: {r.claims[0].status}
                </div>
              )}
            </div>

            {r.status === 'EARNED' && (
              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  onClick={() => handleClaim(r.id, 'CASH')}
                  disabled={submitting === r.id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Request Cash
                </button>
                <button
                  onClick={() => handleClaim(r.id, 'FOOD')}
                  disabled={submitting === r.id}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  Request Food
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
