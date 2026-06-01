'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
    setIsLoading(true);
    setAuthError('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setAuthError('Invalid email or password');
      } else {
        router.push('/user-dashboard');
      }
    } catch (error) {
      setAuthError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/user-dashboard' });
    } catch (error) {
      setAuthError('An error occurred with Google Sign-In');
      setIsGoogleLoading(false);
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
          style={{ background: 'var(--negative-bg)', border: '1px solid rgba(255,77,106,0.25)', color: 'var(--negative)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all duration-200 mb-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        {isGoogleLoading ? (
          <SpinnerIcon />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>or sign in with email</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
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
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
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
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
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
      <path d="M2 2l14 14M7.4 7.5A2.5 2.5 0 0011.5 11.6M5 4.6C2.8 6 1 9 1 9s3 6 8 6c1.6 0 3-.5 4.2-1.3M9 3c5 0 8 6 8 6s-.8 1.6-2.2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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