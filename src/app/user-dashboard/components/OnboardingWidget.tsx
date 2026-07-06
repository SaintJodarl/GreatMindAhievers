'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  User,
  X,
} from 'lucide-react';

interface OnboardingWidgetProps {
  summary: any;
  onRefresh: () => void;
  initialStep?: number;
  onClose?: () => void;
}

const getActiveOnboardingStep = (step?: number | null) => {
  if (!step || step < 1) return 1;
  if (step >= 3) return 3;
  return step;
};

const getOnboardingProgressStep = (step?: number | null) => {
  if (!step || step < 1) return 1;
  if (step >= 4) return 4;
  return step;
};

export default function OnboardingWidget({
  summary,
  onRefresh,
  initialStep,
  onClose,
}: OnboardingWidgetProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const lastSyncedStepRef = React.useRef<number | null>(null);

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
    code: '',
  });

  useEffect(() => {
    if (!summary) return;

    const parts = (summary.name || '').split(' ');
    const fName = parts[0] || '';
    const lName = parts.slice(1).join(' ') || '';

    setFormData((prev) => ({
      ...prev,
      firstName: summary.profile?.firstName || fName,
      lastName: summary.profile?.lastName || lName,
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

    const serverStep = summary.onboardingStep ?? 1;
    if (lastSyncedStepRef.current === null) {
      setActiveStep(getActiveOnboardingStep(initialStep || serverStep));
      lastSyncedStepRef.current = serverStep;
    } else if (serverStep !== lastSyncedStepRef.current) {
      setActiveStep(getActiveOnboardingStep(serverStep));
      lastSyncedStepRef.current = serverStep;
    }
  }, [summary, initialStep]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api('/api/user/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data.message || 'Failed to save profile information');
      }

      setActiveStep(3);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile info.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitActivation = async () => {
    if (!formData.code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api('/api/user/activation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit activation code');
      }

      setSuccess(data.message || 'Account successfully activated!');
      onRefresh();
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during account activation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipActivation = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api('/api/user/onboarding/skip-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to skip activation');
      }

      setSuccess('Onboarding completed. Activation skipped.');
      onRefresh();
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while skipping activation.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 1) {
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

    if (stepNumber === 2) {
      return !!(formData.bankName && formData.accountNumber && formData.accountName);
    }

    return true;
  };

  const stepsList = [
    { id: 1, label: 'Personal Information', icon: User },
    { id: 2, label: 'Banking Information', icon: CreditCard },
    { id: 3, label: 'Activation', icon: KeyRound },
  ];

  const progressStep = getOnboardingProgressStep(summary.onboardingStep ?? 1);

  return (
    <div className="bg-white rounded-3xl border border-indigo-150 shadow-md shadow-indigo-600/5 overflow-hidden animate-fade-in space-y-6">
      <div className="bg-gradient-to-r from-indigo-50/50 via-blue-50/20 to-white p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-full p-1.5 shadow-sm border border-gray-200 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}
        <div className="space-y-1.5 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900">Complete Onboarding</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
            Please complete your personal details, add banking information, and enter your
            Activation Code to unlock full GMA platform access.
          </p>
        </div>
        <div className="flex-shrink-0 bg-indigo-50/30 border border-indigo-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              onboarding status
            </span>
            <span className="text-xs font-extrabold text-indigo-700 uppercase font-mono tracking-wider">
              {summary.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {stepsList.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = progressStep > step.id;
            const isActive = activeStep === step.id;

            return (
              <button
                key={`step-btn-${step.id}`}
                disabled={step.id > progressStep}
                onClick={() => {
                  setError(null);
                  setActiveStep(step.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <StepIcon size={14} />
                <span>{step.label}</span>
                {isCompleted && <span className="ml-1 text-[10px] text-emerald-600">Done</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold">
            <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={16} />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold">
            <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
            <div className="flex-1">{success}</div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Step 1 - Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Email Address
                </label>
                <input
                  type="text"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={!validateStep(1)}
                onClick={() => setActiveStep(2)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                Next Step <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Step 2 - Banking Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Bank Name
                </label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 bg-white"
                >
                  <option value="" disabled>
                    Select a bank
                  </option>
                  {[
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
                  ].map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="10 digit account number"
                  maxLength={10}
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Account Name
                </label>
                <input
                  type="text"
                  name="accountName"
                  placeholder="Official name on bank account"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !validateStep(2)}
                onClick={handleSaveProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                Save and Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Step 3 - Activation
            </h3>

            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 font-semibold leading-relaxed">
              <KeyRound className="text-indigo-600 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="font-bold">Provide Activation Pin</p>
                <p className="text-gray-500 mt-1">
                  Please enter the security activation code issued to you by the admin desk to
                  complete registration and unlock full membership features.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Activation Code
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. GMA-123456"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono uppercase tracking-wider"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all text-xs"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSkipActivation}
                    className="text-gray-500 hover:text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all text-xs border border-gray-200 hover:bg-gray-50"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    disabled={loading || !formData.code.trim()}
                    onClick={handleSubmitActivation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="animate-spin" size={14} />}
                    Redeem and Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
