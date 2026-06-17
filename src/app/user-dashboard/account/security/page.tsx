'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, KeyRound, Monitor, History, Loader2, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';

export default function SecurityPage() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAVerifying, setIs2FAVerifying] = useState(false);

  // Browser info
  const [userAgentInfo, setUserAgentInfo] = useState({
    browser: 'Chrome / Windows',
    ip: '102.89.34.112',
    location: 'Lagos, Nigeria',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      let browser = 'Unknown Browser';
      if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') > -1) browser = 'Safari';
      else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (ua.indexOf('Edge') > -1) browser = 'Edge';

      let os = 'Unknown OS';
      if (ua.indexOf('Windows') > -1) os = 'Windows';
      else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
      else if (ua.indexOf('Linux') > -1) os = 'Linux';
      else if (ua.indexOf('Android') > -1) os = 'Android';
      else if (ua.indexOf('iPhone') > -1) os = 'iOS';

      setUserAgentInfo({
        browser: `${browser} / ${os}`,
        ip: '197.210.64.85', // Simulated WAN IP
        location: 'Lagos, Nigeria',
      });
    }
  }, []);

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
      const res = await fetch('/api/user/account/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      // Deactivating 2FA
      setIs2FAEnabled(false);
      setSuccess('Two-Factor Authentication disabled.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setShow2FADialog(true);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIs2FAVerifying(true);
    setError(null);

    // Simulate verification delay
    setTimeout(() => {
      setIs2FAVerifying(false);
      setIs2FAEnabled(true);
      setShow2FADialog(false);
      setVerificationCode('');
      setSuccess('Two-Factor Authentication enabled successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }, 1500);
  };

  const activeSessions = [
    {
      id: 'sess-current',
      device: 'Desktop PC',
      browser: userAgentInfo.browser,
      ip: userAgentInfo.ip,
      location: userAgentInfo.location,
      status: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-mobile',
      device: 'Mobile Phone',
      browser: 'Safari / iPhone',
      ip: '102.89.45.12',
      location: 'Ikeja, Nigeria',
      status: 'Active 2 hours ago',
      isCurrent: false,
    },
  ];

  const loginHistory = [
    {
      id: 'log-1',
      date: new Date().toLocaleString(),
      device: 'Desktop PC',
      browser: userAgentInfo.browser,
      ip: userAgentInfo.ip,
      location: userAgentInfo.location,
      status: 'Successful',
    },
    {
      id: 'log-2',
      date: new Date(Date.now() - 3600000 * 2).toLocaleString(),
      device: 'Mobile Phone',
      browser: 'Safari / iPhone',
      ip: '102.89.45.12',
      location: 'Ikeja, Nigeria',
      status: 'Successful',
    },
    {
      id: 'log-3',
      date: new Date(Date.now() - 3600000 * 24).toLocaleString(),
      device: 'Desktop PC',
      browser: userAgentInfo.browser,
      ip: userAgentInfo.ip,
      location: userAgentInfo.location,
      status: 'Successful',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Security Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account credentials, sessions, and multi-factor authentication.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Change Password Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2.5">
              <KeyRound className="text-indigo-600" size={22} />
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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

          {/* Active Sessions Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2.5">
              <Monitor className="text-indigo-600" size={22} />
              Active Sessions
            </h2>
            <p className="text-sm text-gray-500 mb-6">These devices are currently logged into your GMA account. You can log out of other devices if you suspect unauthorized access.</p>

            <div className="divide-y divide-gray-100">
              {activeSessions.map((session) => (
                <div key={session.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex gap-4 items-start">
                    <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 mt-1">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 flex items-center gap-2">
                        {session.device}
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full">
                            Current Session
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {session.browser} • {session.ip}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {session.location}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${session.isCurrent ? 'text-green-600' : 'text-gray-500'}`}>
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 2FA Sidebar Panel */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2.5">
              <Shield className="text-indigo-600" size={22} />
              Multi-Factor Auth
            </h2>
            <p className="text-sm text-gray-500 mb-6">Protect your earnings and transactions with an extra layer of code validation.</p>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
              <div>
                <span className="block text-sm font-semibold text-gray-900">Authenticator App</span>
                <span className="block text-xs text-gray-500">Google Authenticator, Authy, etc.</span>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  is2FAEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    is2FAEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {is2FAEnabled ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs">
                <strong>✓ Two-Factor Authentication is Active.</strong> Whenever you log in or process a withdrawal, you will be prompted to enter the generated code.
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                Turn on authenticator toggles to configure QR code codes for verification.
              </div>
            )}
          </div>

          {/* Login Logs Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <History className="text-indigo-600" size={22} />
              Login History
            </h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {loginHistory.map((log) => (
                <div key={log.id} className="text-xs border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>{log.device}</span>
                    <span className="text-green-600 font-semibold">{log.status}</span>
                  </div>
                  <span className="block text-gray-500 mt-0.5">{log.browser} • {log.ip}</span>
                  <span className="block text-gray-400 mt-0.5">{log.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 2FA Setup Dialog */}
      {show2FADialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="text-indigo-600" />
                Setup Authenticator
              </h3>
              <button
                onClick={() => setShow2FADialog(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                1. Scan the QR code below using your Google Authenticator, Authy, or Microsoft Authenticator app.
              </p>

              {/* Simulated QR Code Wrapper */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl max-w-[200px] mx-auto">
                <div className="bg-white p-3 rounded-xl shadow-inner">
                  {/* Styled QR code representation */}
                  <div className="w-36 h-36 border-4 border-indigo-600 bg-gray-950 flex flex-wrap p-1.5 gap-1 select-none">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-5 h-5 rounded-sm ${
                          (i % 3 === 0 || i % 4 === 0) && i !== 14 ? 'bg-white' : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-500 mt-2">SECRET: GMA-MEMBER-SEC</span>
              </div>

              <p className="text-sm text-gray-600">
                2. Enter the 6-digit confirmation code from your authenticator app below to activate:
              </p>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-center text-lg font-mono tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="000000"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2FADialog(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-semibold transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={is2FAVerifying}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    {is2FAVerifying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
