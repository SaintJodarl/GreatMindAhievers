'use client';

import React, { useState } from 'react';
import { Shield, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSecurityPage() {
  const { logout } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/account/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to update password');
      }

      setSuccess('Password updated successfully! Logging you out...');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Delay slightly so the user sees the success message, then log them out
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Configure security settings and system password credentials.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar inside settings for future expansion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-2 h-fit">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Settings Navigation</h2>
          <button className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm bg-indigo-50 text-indigo-700 flex items-center gap-2 transition-colors">
            <Shield size={16} />
            Security Settings
          </button>
          <button disabled className="w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed opacity-50">
            Profile Settings
          </button>
          <button disabled className="w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed opacity-50">
            Organization Config
          </button>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
              <KeyRound className="text-indigo-600" size={22} />
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
