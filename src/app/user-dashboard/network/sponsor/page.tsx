import React from 'react';
import { UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Sponsor Info | My Network',
};

export default function SponsorInfoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sponsor Information</h1>
        <p className="text-gray-500 mt-1">Details about the member who referred you.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
             <UserCheck size={40} className="text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Sponsor</h2>
            <div className="mt-4 space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">System Admin</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Contact Email</span>
                <span className="font-semibold text-gray-900">admin@gma.network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
