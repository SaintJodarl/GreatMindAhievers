import { prisma } from '@/lib/prisma';
import React from 'react';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Commissions | Admin',
};

export default async function CommissionsPage() {
  const commissions = await prisma.commission.findMany();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Settings</h1>
          <p className="text-gray-500 mt-1">Configure compensation plan payouts and bonuses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commissions.map((comm) => (
          <div key={comm.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Settings size={24} />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                comm.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {comm.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{comm.type} BONUS</h2>
            <div className="mt-auto">
              {comm.percentage !== null && (
                <p className="text-3xl font-black text-indigo-600">{comm.percentage}% <span className="text-sm font-medium text-gray-500">of volume</span></p>
              )}
              {comm.fixedAmount !== null && (
                <p className="text-3xl font-black text-indigo-600">₦{comm.fixedAmount} <span className="text-sm font-medium text-gray-500">fixed reward</span></p>
              )}
            </div>
            <button className="mt-6 w-full py-2 bg-gray-50 hover:bg-indigo-50 text-indigo-600 rounded-xl font-medium transition-colors border border-gray-200 hover:border-indigo-200">
              Edit Settings
            </button>
          </div>
        ))}

        {commissions.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No commission settings configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
