import React from 'react';
import { User } from 'lucide-react';

export const metadata = {
  title: 'Profile | Account',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl">
        <div className="flex items-start gap-8 mb-8 border-b border-gray-100 pb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
            M
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Member User</h2>
            <p className="text-gray-500">Member ID: GMA-MBR1</p>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" defaultValue="Member" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" defaultValue="User" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50" defaultValue="adebayo.okafor@gma.network" disabled />
            <p className="text-xs text-gray-500 mt-1">Contact support to change your email address.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="+234 XXX XXXX" />
          </div>
          <button type="button" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
