import { prisma } from '@/lib/prisma';
import React from 'react';
import { Plus, KeyRound } from 'lucide-react';

export const metadata = {
  title: 'Registration Codes | Admin',
};

export default async function CodesPage() {
  const codes = await prisma.adminCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      regUser: true,
      kycUser: true
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registration & KYC Codes</h1>
          <p className="text-gray-500 mt-1">Manage system-generated codes for members.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus size={20} />
          Generate New Codes
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Code</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Type</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Used By</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono font-medium text-indigo-700">
                      <KeyRound size={16} />
                      {code.code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      code.type === 'REGISTRATION' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {code.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      code.status === 'UNUSED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {code.regUser?.email || code.kycUser?.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {code.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No codes found.
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
