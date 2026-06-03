import { prisma } from '@/lib/prisma';
import React from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export const metadata = {
  title: 'KYC Management | Admin',
};

export default async function KycPage() {
  const submissions = await prisma.kYCSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
          <p className="text-gray-500 mt-1">Review and approve Know Your Customer submissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Member</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">ID Type</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">ID Number</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sub.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{sub.fullName}</p>
                    <p className="text-xs text-gray-500">{sub.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    {sub.idType}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {sub.idNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sub.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Document">
                        <Eye size={20} />
                      </button>
                      {sub.status === 'SUBMITTED' && (
                        <>
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                            <CheckCircle size={20} />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No KYC submissions found.
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
