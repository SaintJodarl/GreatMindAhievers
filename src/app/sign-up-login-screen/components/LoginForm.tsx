'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const [authError, setAuthError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    setAuthError('');

    try {
      await login(data.email, data.password);
    } catch (error: any) {
      setAuthError(error.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };



  return (
    <div className="animate-slide-up">
      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Welcome back
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Sign in to your GMA member account
        </p>
      </div>

      {authError && (
        <div
          className="flex items-start gap-3 p-3.5 rounded-lg mb-5 text-sm"
          style={{
            background: 'var(--negative-bg)',
            border: '1px solid rgba(255,77,106,0.25)',
            color: 'var(--negative)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="mt-0.5 flex-shrink-0"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 5v3.5M8 11h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{authError}</span>
        </div>
      )}



      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--foreground)' }}
          >
            Email Address
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="your@email.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--foreground)' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="Enter your password"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--primary)' }}
              {...register('rememberMe')}
            />
            <span className="text-sm" style={{ color: 'var(--secondary-foreground)' }}>
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={() => router.push('/sign-up-login-screen/forgot-password')}
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              Signing in...
            </>
          ) : (
            'Sign In to Dashboard'
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>
        Don&apos;t have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          className="font-semibold transition-colors hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          Create one free
        </button>
      </p>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2 2l14 14M7.4 7.5A2.5 2.5 0 0011.5 11.6M5 4.6C2.8 6 1 9 1 9s3 6 8 6c1.6 0 3-.5 4.2-1.3M9 3c5 0 8 6 8 6s-.8 1.6-2.2 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
