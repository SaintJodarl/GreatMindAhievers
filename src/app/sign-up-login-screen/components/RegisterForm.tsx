'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, UserCheck, AlertTriangle } from 'lucide-react';
import {
  ACCOUNT_REGISTRATION_FIELDS,
  ACCOUNT_REGISTRATION_SECTIONS,
  NIGERIAN_BANKS,
} from '@/lib/registration/account-registration-fields';

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

const FIELDS = ACCOUNT_REGISTRATION_FIELDS;

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
            {ACCOUNT_REGISTRATION_SECTIONS.account}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="register-first-name"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.firstName.label}
              </label>
              <input
                id="register-first-name"
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
              <label
                htmlFor="register-last-name"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.lastName.label}
              </label>
              <input
                id="register-last-name"
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
              <label
                htmlFor="register-username"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.username.label}
              </label>
              <input
                id="register-username"
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
              <label
                htmlFor="register-phone"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.phone.label}
              </label>
              <input
                id="register-phone"
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
            <label
              htmlFor="register-email"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {FIELDS.email.label}
            </label>
            <input
              id="register-email"
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
              <label
                htmlFor="register-password"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.password.label}
              </label>
              <div className="relative">
                <input
                  id="register-password"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <label
                htmlFor="register-confirm-password"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.confirmPassword.label}
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
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
                  aria-label={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
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
          <h3 className="text-sm font-bold text-indigo-900 border-b pb-1">
            {ACCOUNT_REGISTRATION_SECTIONS.kyc}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="register-gender"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.gender.label}
              </label>
              <select
                id="register-gender"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                {...register('gender', { required: 'Required' })}
              >
                <option value="">{FIELDS.gender.placeholder}</option>
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
              <label
                htmlFor="register-state"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.state.label}
              </label>
              <input
                id="register-state"
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
            <label
              htmlFor="register-address"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {FIELDS.address.label}
            </label>
            <input
              id="register-address"
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
            <label
              htmlFor="register-bank-name"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {FIELDS.bankName.label}
            </label>
            <select
              id="register-bank-name"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('bankName', { required: 'Required' })}
            >
              <option value="">{FIELDS.bankName.placeholder}</option>
              {NIGERIAN_BANKS.slice()
                .sort()
                .map((bank) => (
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
              <label
                htmlFor="register-account-number"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.accountNumber.label}
              </label>
              <input
                id="register-account-number"
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
              <label
                htmlFor="register-account-name"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {FIELDS.accountName.label}
              </label>
              <input
                id="register-account-name"
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
          <h3 className="text-sm font-bold text-indigo-900 border-b pb-1">
            {ACCOUNT_REGISTRATION_SECTIONS.codes}
          </h3>

          <div className="space-y-1">
            <label
              htmlFor="register-sponsor-code"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {FIELDS.sponsorCode.label}
            </label>
            <input
              id="register-sponsor-code"
              type="text"
              placeholder={FIELDS.sponsorCode.placeholder}
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
            <label
              htmlFor="register-activation-code"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"
            >
              {FIELDS.activationCode.label}
            </label>
            <input
              id="register-activation-code"
              type="text"
              placeholder={FIELDS.activationCode.placeholder}
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
                id="register-agree-terms"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 peer"
                {...register('agreeTerms', { required: 'Required' })}
              />
            </div>
            <span className="text-xs text-gray-600 leading-relaxed">
              I agree to the{' '}
              <a
                href="mailto:info@greatmindachievers.org?subject=Great%20Mind%20Achievers%20Terms%20of%20Service%20Request"
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
