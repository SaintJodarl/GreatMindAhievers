import React from 'react';
import { Settings, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Security Settings | Account',
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Security Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account security and authentication.</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="text-indigo-600" size={24} />
            Change Password
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg p-2.5" />
            </div>
            <button type="button" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              Update Password
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={24} />
            Two-Factor Authentication (2FA)
          </h2>
          <p className="text-gray-600 mb-6">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
          <button className="px-6 py-2.5 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
