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
  agreeTerms: boolean;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();

  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    setAuthError('');
    try {
      const sponsor = searchParams?.get('ref') || searchParams?.get('sponsor');
      const sponsorCode = sponsor?.trim().toUpperCase();
      const payload: Record<string, string> = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };

      if (sponsorCode) {
        payload.sponsorCode = sponsorCode;
      }

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
      } catch (loginErr) {
        setSubmitted(true);
      }
    } catch (error) {
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
            Your account has been created. Please sign in below to complete your profile and activate your account.
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
        <p className="text-xs text-gray-500 mt-1">Get started with Great Mind Achievers.</p>
      </div>

      {authError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2 text-xs font-semibold">
          <AlertTriangle className="text-rose-600 mt-0.5 flex-shrink-0" size={16} />
          <div className="flex-1">{authError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
            <input
              type="text"
              placeholder="First name"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('firstName', { required: 'Required' })}
            />
            {errors.firstName && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
              {...register('lastName', { required: 'Required' })}
            />
            {errors.lastName && (
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            {...register('username', {
              required: 'Username is required',
              minLength: { value: 3, message: 'Min 3 characters' },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Alphanumeric and underscores only' },
            })}
          />
          {errors.username && (
            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.username.message}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            placeholder="your@email.com"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
          />
          {errors.email && (
            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            placeholder="e.g. +2348031234567"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            {...register('phone', { required: 'Phone is required' })}
          />
          {errors.phone && (
            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.phone.message}</p>
          )}
        </div>

        {/* Passwords */}
        <div className="space-y-3">
          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Choose a strong password"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must include uppercase, lowercase, and number',
                  },
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
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-mono"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
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
              <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
          <input
            type="checkbox"
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 border-gray-300"
            {...register('agreeTerms', { required: 'You must agree to the terms' })}
          />
          <span className="text-[11px] text-gray-500 leading-relaxed font-semibold">
            I agree to the{' '}
            <span className="text-indigo-600 hover:underline">Terms of Service</span> and{' '}
            <span className="text-indigo-600 hover:underline">Privacy Policy</span> of Great Mind Achievers.
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-[10px] font-semibold text-rose-600">{errors.agreeTerms.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-sm disabled:opacity-50"
        >
          {isLoading && <Loader2 className="animate-spin" size={14} />}
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Already a member?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold hover:underline text-indigo-600"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
