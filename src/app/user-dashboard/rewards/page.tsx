'use client';

import React, { useEffect, useState } from 'react';

type ClaimOption = 'CASH' | 'FOOD' | 'PACKAGE';

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

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
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load rewards');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleClaim = (rewardId: string, option: ClaimOption) => {
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

  const stageSummary = data?.stageSummary;
  const currentProgress = data?.progress?.find((item: any) => item.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rewards & Stage Progress</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your compensation stage without changing your permanent genealogy position.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current Stage</p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {stageSummary?.currentStageName || 'Registered / Active'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {stageSummary?.currentStageNumberLabel || 'Account status'}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Attained: {formatDate(stageSummary?.stageUpdatedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Next Stage</p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {stageSummary?.nextStageName || 'Completed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{stageSummary?.nextRequirement}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Progress</p>
          {currentProgress ? (
            <>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                {currentProgress.qualifiedContributorCount} of{' '}
                {currentProgress.requiredContributorCount}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Remaining contributors: {currentProgress.remainingContributorCount}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                {stageSummary?.compensationPlanStatus === 'COMPLETED'
                  ? 'Plan completed'
                  : 'Awaiting recalculation'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {stageSummary?.finalStageCompletedAt
                  ? `Completed on ${formatDate(stageSummary.finalStageCompletedAt)}`
                  : 'Progress appears after the next qualification check.'}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Stage History</h2>
        </div>
        {data?.history?.length ? (
          <div className="divide-y divide-gray-100">
            {data.history.map((item: any) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.toStageName}</h3>
                    <p className="text-sm text-gray-500">
                      Qualified on {formatDate(item.qualifiedAt)} from {item.fromStageName}
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    {item.contributors?.length || 0} contributors recorded
                  </span>
                </div>
                {item.contributors?.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase text-gray-400">
                        <tr>
                          <th className="py-2 pr-4">Contributor</th>
                          <th className="py-2 pr-4">Stage at Qualification</th>
                          <th className="py-2 pr-4">Depth</th>
                          <th className="py-2 pr-4">Qualified At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {item.contributors.map((contributor: any) => (
                          <tr key={contributor.id}>
                            <td className="py-2 pr-4">
                              {contributor.contributorMember.name ||
                                contributor.contributorMember.username ||
                                contributor.contributorMember.email ||
                                contributor.contributorMemberId}
                            </td>
                            <td className="py-2 pr-4">{contributor.contributorStageName}</td>
                            <td className="py-2 pr-4">{contributor.genealogyDepth}</td>
                            <td className="py-2 pr-4">
                              {formatDate(contributor.contributorQualifiedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No completed stage history yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Earned Rewards</h2>
        </div>
        {data?.rewards?.length ? (
          <div className="divide-y divide-gray-100">
            {data.rewards.map((reward: any) => (
              <div
                key={reward.id}
                className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
              >
                <div>
                  <h3 className="font-bold text-gray-900">{reward.stageName}</h3>
                  <p className="mt-1 text-lg font-semibold text-green-700">
                    {formatMoney(reward.rewardValue)}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm text-gray-600">{reward.rewardPackage}</p>
                  <p className="mt-2 text-sm font-medium text-gray-700">Status: {reward.status}</p>
                  {reward.claims?.length > 0 && (
                    <p className="mt-2 rounded bg-indigo-50 p-2 text-sm text-indigo-700">
                      Claim Request: {reward.claims[0].selectedOption} - {reward.claims[0].status}
                    </p>
                  )}
                </div>

                {reward.status === 'EARNED' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleClaim(reward.id, 'CASH')}
                      disabled={submitting === reward.id}
                      className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Request Cash
                    </button>
                    <button
                      onClick={() => handleClaim(reward.id, 'PACKAGE')}
                      disabled={submitting === reward.id}
                      className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      Request Package
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No rewards earned yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Repayable Stage Loans</h2>
        </div>
        {data?.loans?.length ? (
          <div className="divide-y divide-gray-100">
            {data.loans.map((loan: any) => (
              <div key={loan.id} className="grid gap-3 p-5 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Stage</p>
                  <p className="font-semibold text-gray-900">{loan.stageName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Principal</p>
                  <p className="font-semibold text-gray-900">{formatMoney(loan.principal)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Interest</p>
                  <p className="font-semibold text-gray-900">{formatMoney(loan.interestAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Outstanding</p>
                  <p className="font-semibold text-gray-900">
                    {formatMoney(loan.outstandingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                  <p className="font-semibold text-gray-900">{loan.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No repayable stage loans recorded.</p>
        )}
      </section>
    </div>
  );
}
