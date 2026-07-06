'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export default function CompleteKycPage() {
  const router = useRouter();
  const { checkSession } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

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
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/user/dashboard-summary');
        if (!res.ok) {
          throw new Error('Failed to load registration details.');
        }

        const summary = await res.json();
        const parts = (summary.name || '').split(' ');

        setIsComplete(
          summary.kycStatus === 'COMPLETE' ||
            summary.kycStatus === 'APPROVED' ||
            summary.onboardingStatus === 'COMPLETE'
        );

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
      } catch (err: any) {
        setError(err.message || 'Error loading registration details.');
      } finally {
        setLoading(false);
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
      return Boolean(
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
      return Boolean(formData.bankName && formData.accountNumber && formData.accountName);
    }

    return true;
  };

  const goToNextStep = () => {
    setError(null);

    if (!validateStep(activeStep)) {
      setError(
        activeStep === 1
          ? 'Please complete all personal information fields.'
          : 'Please complete all banking information fields.'
      );
      return;
    }

    setActiveStep((step) => Math.min(step + 1, 3));
  };

  const completeRegistration = async () => {
    setError(null);

    if (!validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields before continuing.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to complete registration.');
      }

      await checkSession(true);
      window.dispatchEvent(new Event('dashboard-refresh'));
      router.push('/user-dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred while completing registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <p className="text-sm text-gray-500">Loading registration details...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Complete Registration
          </h1>
          <p className="text-gray-500 mt-1">Your registration details are complete.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 max-w-2xl text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Complete</h2>
          <p className="text-gray-500 mb-6">
            Your personal and banking information has been saved.
          </p>
          <button
            onClick={() => router.push('/user-dashboard')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, label: 'Personal Information', icon: User },
    { id: 2, label: 'Banking Information', icon: CreditCard },
    { id: 3, label: 'Complete Registration', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Complete Registration
        </h1>
        <p className="text-gray-500 mt-1">
          Confirm your personal details and banking information.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                disabled={step.id > activeStep}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isDone
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                }`}
              >
                <StepIcon size={16} />
                {step.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (activeStep < 3) {
              goToNextStep();
            } else {
              completeRegistration();
            }
          }}
          className="space-y-5"
        >
          {activeStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <select
                  name="bankName"
                  required
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select bank</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  required
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  name="accountName"
                  required
                  value={formData.accountName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h2 className="text-base font-bold text-green-950">
                    Ready to complete registration
                  </h2>
                  <p className="text-sm text-green-800 mt-1">
                    Your personal and banking details will be saved, then you will return to the
                    dashboard overview.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={activeStep === 1 || submitting}
              onClick={() => {
                setError(null);
                setActiveStep((step) => Math.max(step - 1, 1));
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Completing...
                </>
              ) : activeStep < 3 ? (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
