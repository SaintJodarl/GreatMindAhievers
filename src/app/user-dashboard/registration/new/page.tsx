import React from 'react';
import { UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Register Member | Registration',
};

export default function RegisterMemberPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register Member</h1>
        <p className="text-gray-500 mt-1">Manually register a new member under your network.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">New Member Details</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="First Name" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="Last Name" disabled />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="Email" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Code</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="e.g. NG-REG001" disabled />
          </div>
          <button type="button" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold opacity-50 cursor-not-allowed">
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
}
