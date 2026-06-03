import React from 'react';
import { GitMerge } from 'lucide-react';

export const metadata = {
  title: 'Downline Members | My Network',
};

export default function DownlineMembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Downline Members</h1>
        <p className="text-gray-500 mt-1">List of all members in your left and right legs.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <GitMerge size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Downline List</h2>
        <p className="text-gray-500 max-w-md text-center mb-6">
          The comprehensive downline list is being compiled. Check back later to see your entire team.
        </p>
        <span className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold text-sm rounded-full">
          Processing Data...
        </span>
      </div>
    </div>
  );
}
