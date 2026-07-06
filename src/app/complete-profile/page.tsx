'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  UserCheck,
} from 'lucide-react';

const BANKS = [
  'Alpha Morgan Bank',
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'FCMB (First City Monument Bank)',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'Globus Bank',
  'Guaranty Trust Bank (GTCO)',
  'Keystone Bank',
  'Nova Commercial Bank',
  'Optimus Bank',
  'Parallex Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank Nigeria',
  'Sterling Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
  'Kuda Bank',
  'Moniepoint Microfinance Bank',
  'OPay',
  'PalmPay',
  'Dot Microfinance Bank',
  'VFD Microfinance Bank',
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, checkSession } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    address: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    if (user?.onboardingStatus === 'COMPLETE') {
      router.push('/user-dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api('/api/user/dashboard-summary');
        if (!res.ok) return;

        const summary = await res.json();
        const parts = (summary.name || '').split(' ');

        setFormData((prev) => ({
          ...prev,
          firstName: summary.profile?.firstName || parts[0] || '',
          lastName: summary.profile?.lastName || parts.slice(1).join(' ') || '',
          email: summary.email || '',
          phone: summary.profile?.phone || summary.phone || '',
          gender: summary.profile?.gender || '',
          dob: summary.profile?.dob
            ? new Date(summary.profile.dob).toISOString().split('T')[0]
            : '',
          address: summary.profile?.address || '',
          bankName: summary.bankName || '',
          accountNumber: summary.accountNumber || '',
          accountName: summary.accountName || '',
        }));
      } catch (err) {
        console.error('Error loading profile summary:', err);
      }
    };

    fetchSummary();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      return !!(
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.gender &&
        formData.dob &&
        formData.address
      );
    }

    if (step === 2) {
      return !!(formData.bankName && formData.accountNumber && formData.accountName);
    }

    return true;
  };

  const saveProfileAndContinue = async () => {
    setError(null);

    if (!validateStep(2)) {
      setError('Please provide complete banking details.');
      return;
    }

    setLoading(true);

    try {
      const res = await api('/api/user/onboarding/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dob: formData.dob,
          address: formData.address,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save onboarding details.');
      }

      setActiveStep(3);
      await checkSession();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    setError(null);

    if (!validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields before continuing.');
      return;
    }

    setLoading(true);

    try {
      const res = await api('/api/user/kyc/submit', {
        method: 'POST',
        body: JSON.stringify({
          completeRegistration: true,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dob: formData.dob,
          address: formData.address,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete registration.');
      }

      await checkSession(true);
      router.push('/user-dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while completing registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setError(null);

    if (!validateStep(1)) {
      setError('Please fill out all personal information fields.');
      return;
    }

    setActiveStep(2);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full mx-auto space-y-8 bg-slate-950/40 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UserCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Complete the required details below and continue to your dashboard.
          </p>
        </div>

        <div className="flex items-center justify-between max-w-md mx-auto py-6">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                    activeStep >= step
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/35 scale-105'
                      : 'bg-slate-800/80 border-slate-700 text-slate-500'
                  }`}
                >
                  {step}
                </div>
                <span className="text-[10px] mt-1 text-slate-400 font-medium">
                  {step === 1 ? 'Personal' : step === 2 ? 'Banking' : 'Complete'}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-[2px] transition-all duration-300 ${
                    activeStep > step ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 animate-slide-up">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {activeStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
                Step 1 - Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Flat 12, Allen Avenue"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in font-sans">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
                Step 2 - Banking Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Bank Name
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    maxLength={10}
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="10-digit NUBAN number"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    placeholder="Full account name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
                Step 3 - Complete Registration
              </h3>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-sm text-emerald-100">
                <CheckCircle2 className="text-emerald-300 mt-0.5 flex-shrink-0" size={18} />
                <span>
                  Your personal and banking details will be saved, then the dashboard overview will
                  load.
                </span>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-850 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setActiveStep((prev) => prev - 1);
                }}
                disabled={loading}
                className="flex items-center gap-2 py-3 px-5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors text-slate-300 disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}

            {activeStep === 1 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/10"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            )}

            {activeStep === 2 && (
              <button
                type="button"
                onClick={saveProfileAndContinue}
                disabled={loading || !validateStep(2)}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Save and Continue
                <ArrowRight size={16} />
              </button>
            )}

            {activeStep === 3 && (
              <button
                type="button"
                onClick={completeRegistration}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-700/60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-600/15"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
