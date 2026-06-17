import React from 'react';
import { GitMerge } from 'lucide-react';

export const metadata = {
  title: 'Placement Manager | Registration',
};

export default function PlacementManagerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Placement Manager</h1>
        <p className="text-gray-500 mt-1">Configure default placement leg for new referrals.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <GitMerge size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Placement Settings</h2>
        <p className="text-gray-500 max-w-md text-center mb-6">
          Placement manager is being updated. Soon you will be able to set auto-placement to Left,
          Right, or Auto-Balance.
        </p>
      </div>
    </div>
  );
}
