'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';


interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

// Mock credentials — backend: replace with real auth endpoint
const DEMO_CREDENTIALS = [
  { role: 'Member', email: 'adebayo.okafor@gma.network', password: 'Member@2026' },
  { role: 'Admin', email: 'admin@gma.network', password: 'Admin@2026' },
];

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUseCredential = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setValue('email', cred.email);
    setValue('password', cred.password);
    setAuthError('');
  };

  // Backend integration point: POST /api/auth/login
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise((r) => setTimeout(r, 1200));

    const matched = DEMO_CREDENTIALS.find(
      (c) => c.email === data.email && c.password === data.password
    );

    if (matched) {
      if (matched.role === 'Admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/user-dashboard';
      }
    } else {
      setAuthError('Invalid credentials — use the demo accounts below to sign in');
    }
    setIsLoading(false);
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
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
          disabled={isLoading}
          className="btn-primary w-full py-3 text-base"
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

      {/* Demo credentials box */}
      <div
        className="mt-6 p-4 rounded-xl"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 5v3M6 4h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          DEMO ACCOUNTS — Click to autofill
        </p>
        <div className="space-y-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <div
              key={`demo-${cred.role}`}
              className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors group"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={() => handleUseCredential(cred)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={
                    cred.role === 'Admin'
                      ? { background: 'rgba(108,71,255,0.15)', color: 'var(--primary)' }
                      : { background: 'rgba(16,217,160,0.1)', color: 'var(--accent)' }
                  }
                >
                  {cred.role}
                </span>
                <span className="text-xs truncate font-mono" style={{ color: 'var(--secondary-foreground)' }}>
                  {cred.email}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCopy(cred.email, `email-${cred.role}`); }}
                  className="p-1 rounded transition-colors hover:bg-muted"
                  style={{ color: 'var(--muted-foreground)' }}
                  title="Copy email"
                >
                  {copiedField === `email-${cred.role}` ? <CheckIcon /> : <CopyIcon />}
                </button>
                <span
                  className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--primary)' }}
                >
                  Use →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
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

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }} />
    </svg>
  );
}