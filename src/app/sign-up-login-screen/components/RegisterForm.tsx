'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, UserCheck, AlertTriangle } from 'lucide-react';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: string;
  address: string;
  state: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  activationCode: string;
  sponsorCode: string;
  agreeTerms: boolean;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  registrationPaused?: boolean;
  registrationPausedMessage?: string;
}

const NIGERIAN_BANKS = [
  'Access Bank',
  'Fidelity Bank',
  'First City Monument Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Holding Company',
  'Union Bank of Nigeria',
  'United Bank for Africa',
  'Zenith Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Heritage Bank',
  'Keystone Bank',
  'Optimus Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Signature Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Unity Bank',
  'Wema Bank',
  'Globus Bank',
  'Parallex Bank',
  'Premium Trust Bank',
  'Jaiz Bank',
  'Lotus Bank',
  'TAJBank',
  'Opay',
  'Moniepoint',
  'Palmpay',
  'Kuda Bank',
];

export default function RegisterForm({
  onSwitchToLogin,
  registrationPaused = false,
  registrationPausedMessage = 'New registrations are briefly unavailable. Please sign in if you already have an account.',
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();

  const searchParams = useSearchParams();
  const sponsorFromUrl = searchParams?.get('ref') || searchParams?.get('sponsor') || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      sponsorCode: sponsorFromUrl.toUpperCase(),
    },
  });

  const password = watch('password');

  React.useEffect(() => {
    if (sponsorFromUrl) {
      setValue('sponsorCode', sponsorFromUrl.toUpperCase());
    }
  }, [sponsorFromUrl, setValue]);

  const onError = () => {
    setAuthError('');
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return;
    if (registrationPaused) {
      setAuthError(registrationPausedMessage);
      return;
    }

    setIsLoading(true);
    setAuthError('');
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        gender: data.gender,
        address: data.address,
        state: data.state,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        activationCode: data.activationCode.trim().toUpperCase(),
        sponsorCode: data.sponsorCode.trim().toUpperCase(),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setAuthError(resData.message || 'Registration failed. Please try again.');
        return;
      }

      // Autologin on success using useAuth context
      try {
        await login(data.email.toLowerCase().trim(), data.password);
      } catch (_loginErr) {
        setSubmitted(true);
      }
    } catch (_error) {
      setAuthError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center animate-slide-up py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-500 shadow-sm shadow-emerald-500/10">
          <UserCheck size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">Registration Successful!</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Your account has been created and fully setup. Please sign in below to access your
            dashboard.
          </p>
        </div>
        <button
          onClick={onSwitchToLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
        <p className="text-xs text-gray-500 mt-1">
          Get started with Great Mind Achievers. Complete your profile to activate your account.
        </p>
      </div>

      {authError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2 text-xs font-semibold">
          <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={16} />
          <div className="flex-1">{authError}</div>
        </div>
      )}

      {registrationPaused && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl flex items-start gap-2 text-xs font-semibold">
          <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
          <div className="flex-1">{registrationPausedMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        {/* Section 1: Account Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-indigo-900 border-b pb-1">
            1. Account Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('firstName', { required: 'Required' })}
              />
              {errors.firstName && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('lastName', { required: 'Required' })}
              />
              {errors.lastName && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('username', { required: 'Required' })}
              />
              {errors.username && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('phone', { required: 'Required' })}
              />
              {errors.phone && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('email', {
                required: 'Required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
              })}
            />
            {errors.email && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'Min 8 chars' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Confirm
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                  {...register('confirmPassword', {
                    required: 'Required',
                    validate: (value) => value === password || 'Mismatch',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: KYC Information */}
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-bold text-indigo-900 border-b pb-1">2. KYC Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Gender
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('gender', { required: 'Required' })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.gender.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                State
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('state', { required: 'Required' })}
              />
              {errors.state && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Full Address
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('address', { required: 'Required' })}
            />
            {errors.address && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="space-y-1 mt-4">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Select Bank
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('bankName', { required: 'Required' })}
            >
              <option value="">Select Bank</option>
              {NIGERIAN_BANKS.sort().map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            {errors.bankName && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.bankName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Account Number
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('accountNumber', {
                  required: 'Required',
                  pattern: { value: /^\d{10}$/, message: '10 digits required' },
                })}
              />
              {errors.accountNumber && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.accountNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Account Name
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('accountName', { required: 'Required' })}
              />
              {errors.accountName && (
                <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {errors.accountName.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Codes */}
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-bold text-indigo-900 border-b pb-1">3. Codes</h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Sponsor / Referral Code
            </label>
            <input
              type="text"
              placeholder="Sponsor code"
              readOnly={!!sponsorFromUrl}
              className={`w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 uppercase ${sponsorFromUrl ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              {...register('sponsorCode', { required: 'Sponsor Code is required' })}
            />
            {errors.sponsorCode && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.sponsorCode.message}
              </p>
            )}
            {sponsorFromUrl && (
              <p className="text-[10px] text-gray-500 font-medium">
                Sponsor code applied from referral link. You still need a separate activation code.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Activation Code (Separate)
            </label>
            <input
              type="text"
              placeholder="e.g. GMA-123456"
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 uppercase"
              {...register('activationCode', {
                required: 'Activation Code is required',
                pattern: {
                  value: /^GMA-\d{6}$/i,
                  message: 'Use a GMA activation code, not your sponsor code',
                },
              })}
            />
            {errors.activationCode && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                {errors.activationCode.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <label className="flex items-start gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 peer"
                {...register('agreeTerms', { required: 'Required' })}
              />
            </div>
            <span className="text-xs text-gray-600 leading-relaxed">
              I agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-600/30 underline-offset-2"
              >
                Terms of Service
              </a>{' '}
              and confirm that all information provided is accurate and true.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 ml-6">
              You must agree to the terms to register
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || registrationPaused}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Account...
              </>
            ) : registrationPaused ? (
              'Registration Paused'
            ) : (
              'Create Account'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-600/30 underline-offset-2 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
