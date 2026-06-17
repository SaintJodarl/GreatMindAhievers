'use client';

import React, { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'bank' | 'notifications'>('personal');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    referralCode: '',
    status: 'PENDING',
    bankName: '',
    accountNumber: '',
    accountName: '',
    notifyEmail: true,
    notifySms: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/account/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile details');
      }
      const data = await res.json();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        referralCode: data.referralCode || '',
        status: data.status || 'PENDING',
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        accountName: data.accountName || '',
        notifyEmail: data.notifyEmail !== undefined ? data.notifyEmail : true,
        notifySms: data.notifySms !== undefined ? data.notifySms : false,
      });
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch('/api/user/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          bankName: profile.bankName,
          accountNumber: profile.accountNumber,
          accountName: profile.accountName,
          notifyEmail: profile.notifyEmail,
          notifySms: profile.notifySms,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      setSuccess('Profile details saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="text-sm text-gray-500">Loading profile settings...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'personal' as const, label: 'Personal Information', icon: User },
    { id: 'bank' as const, label: 'Bank Details', icon: CreditCard },
    { id: 'notifications' as const, label: 'Notification Preferences', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your identity, payout options, and alerts.</p>
      </div>

      {/* Tabs list */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 border-b border-gray-100 pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm uppercase">
                  {getInitials(profile.name)}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">{profile.name || 'GMA Member'}</h2>
                  <p className="text-gray-500 text-sm">
                    Member ID: <span className="font-mono">{profile.referralCode || 'N/A'}</span>
                  </p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      profile.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}
                  >
                    {profile.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Full legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Contact support to change your registered email address.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Bank Information</h3>
                <p className="text-sm text-gray-500">Provide bank details where your commissions will be disbursed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={profile.bankName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Zenith Bank, GTBank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={profile.accountNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={profile.accountName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Name matching the bank account"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Notification Channels</h3>
                <p className="text-sm text-gray-500">Configure how you would like to be alerted for earnings, downline registrations, and updates.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 border border-gray-150 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifyEmail"
                    checked={profile.notifyEmail}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">Email Notifications</span>
                    <span className="block text-xs text-gray-500">Receive summaries of weekly payouts, direct signups, and official announcements.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-gray-150 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifySms"
                    checked={profile.notifySms}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">SMS Alerts</span>
                    <span className="block text-xs text-gray-500">Receive instant text messages when a matching bonus or referral commission hits your wallet.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
