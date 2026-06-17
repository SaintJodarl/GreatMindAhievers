import { prisma } from '@/lib/prisma';
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Withdrawals | Admin',
};

export default async function WithdrawalsPage() {
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 mt-1">Review and process member withdrawal requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Member</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Amount (₦)</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Method & Details</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {withdrawal.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{withdrawal.user.name}</p>
                    <p className="text-xs text-gray-500">{withdrawal.user.email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{withdrawal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="font-medium">{withdrawal.method}</span>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                      {withdrawal.details}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        withdrawal.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {withdrawal.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
