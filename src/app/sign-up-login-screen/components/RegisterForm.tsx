'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  sponsorCode: string;
  position: 'left' | 'right' | 'auto';
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  kycIdType: string;
  kycIdNumber: string;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const STEPS = [
  { id: 1, label: 'Personal Info', icon: '👤' },
  { id: 2, label: 'Sponsor & Position', icon: '🌐' },
  { id: 3, label: 'Security', icon: '🔐' },
  { id: 4, label: 'KYC Upload', icon: '📋' },
];

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [kycFiles, setKycFiles] = useState<{ id: File | null; address: File | null; selfie: File | null }>({
    id: null, address: null, selfie: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: { position: 'auto' },
  });

  const password = watch('password');

  const handleNext = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    if (step === 1) fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'country'];
    if (step === 2) fieldsToValidate = ['sponsorCode', 'position'];
    if (step === 3) fieldsToValidate = ['password', 'confirmPassword', 'agreeTerms'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  // Backend integration point: POST /api/auth/register
  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setIsLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center animate-slide-up py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(16,217,160,0.1)', border: '2px solid var(--accent)' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14l7 7L23 8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Registration Submitted!
        </h3>
        <p className="text-sm mb-1" style={{ color: 'var(--secondary-foreground)' }}>
          Your account is under review. KYC verification typically takes 24–48 hours.
        </p>
        <p className="text-xs mb-6 font-mono-nums" style={{ color: 'var(--accent)' }}>
          Your Member ID: GMA-{Math.floor(50000 + step * 1234)}
        </p>
        <button onClick={onSwitchToLogin} className="btn-primary w-full">
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={`step-indicator-${s.id}`}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={
                    step > s.id
                      ? { background: 'var(--accent)', color: '#0D0F1A' }
                      : step === s.id
                      ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 0 12px rgba(108,71,255,0.4)' }
                      : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                  }
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                <span
                  className="text-xs hidden sm:block"
                  style={{ color: step === s.id ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 transition-all duration-500"
                  style={{ background: step > s.id ? 'var(--accent)' : 'var(--border)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            {STEPS[step - 1].icon} {STEPS[step - 1].label}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Step {step} of {STEPS.length}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  First Name
                </label>
                <input
                  className="input-field"
                  placeholder="First name"
                  {...register('firstName', { required: 'Required' })}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Last Name
                </label>
                <input
                  className="input-field"
                  placeholder="Last name"
                  {...register('lastName', { required: 'Required' })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="+1 555 000 0000"
                {...register('phone', { required: 'Phone is required' })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Country
              </label>
              <select
                className="input-field"
                {...register('country', { required: 'Country is required' })}
              >
                <option value="">Select country</option>
                {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United States', 'India', 'Philippines', 'Malaysia', 'Indonesia', 'United Kingdom', 'Canada', 'Australia'].map((c) => (
                  <option key={`country-${c}`} value={c}>{c}</option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.country.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Sponsor & Position */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Sponsor / Referral Code
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Enter the referral code from the person who invited you. Leave blank if joining directly.
              </p>
              <input
                className="input-field font-mono uppercase tracking-widest"
                placeholder="GMA-XXXXX"
                {...register('sponsorCode')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Binary Position Preference
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Choose where you prefer to be placed in your sponsor&apos;s binary tree.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'left', label: 'Left Leg', desc: 'Left side of sponsor' },
                  { value: 'right', label: 'Right Leg', desc: 'Right side of sponsor' },
                  { value: 'auto', label: 'Auto Place', desc: 'System assigns' },
                ].map((opt) => {
                  const isSelected = watch('position') === opt.value;
                  return (
                    <label
                      key={`pos-${opt.value}`}
                      className="flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-150"
                      style={
                        isSelected
                          ? { background: 'rgba(108,71,255,0.15)', border: '1px solid var(--primary)' }
                          : { background: 'var(--muted)', border: '1px solid var(--border)' }
                      }
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        className="sr-only"
                        {...register('position', { required: true })}
                      />
                      <span className="text-lg mb-1">
                        {opt.value === 'left' ? '◀' : opt.value === 'right' ? '▶' : '⚡'}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-center mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {opt.desc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Spillover info */}
            <div
              className="p-3 rounded-lg flex items-start gap-2"
              style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0" style={{ color: 'var(--info)' }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 6v4M7 5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <p className="text-xs" style={{ color: 'var(--info)' }}>
                Spillover placement: If your preferred position is occupied, the system will auto-place you in the next available slot below using depth-first binary logic.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Create Password
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Min. 8 characters with uppercase, number, and special character.
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
                      message: 'Must include uppercase, number, and special character',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {showPassword
                      ? <path d="M2 2l12 12M6.5 6.6A2.2 2.2 0 009.4 9.5M4.5 4.1C2.5 5.3 1 8 1 8s2.7 5 7 5c1.4 0 2.7-.4 3.8-1.1M7 3c4.3 0 7 5 7 5s-.7 1.4-2 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      : <><path d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                style={{ accentColor: 'var(--primary)' }}
                {...register('agreeTerms', { required: 'You must agree to the terms' })}
              />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--secondary-foreground)' }}>
                I agree to the{' '}
                <span className="underline cursor-pointer" style={{ color: 'var(--primary)' }}>
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="underline cursor-pointer" style={{ color: 'var(--primary)' }}>
                  Privacy Policy
                </span>{' '}
                of Great Mind Achievers. I understand this is a network marketing platform and earnings are not guaranteed.
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-xs" style={{ color: 'var(--negative)' }}>{errors.agreeTerms.message}</p>
            )}
          </div>
        )}

        {/* Step 4: KYC Upload */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div
              className="p-3 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--warning)' }}>
                KYC Required for Withdrawals
              </p>
              <p className="text-xs" style={{ color: 'var(--secondary-foreground)' }}>
                Upload clear photos of your documents. Files must be JPG/PNG, max 5MB each.
              </p>
            </div>

            {[
              { key: 'id' as const, label: 'Government-Issued ID', desc: 'Passport, National ID, or Driver\'s License (front)' },
              { key: 'address' as const, label: 'Proof of Address', desc: 'Utility bill or bank statement (last 3 months)' },
              { key: 'selfie' as const, label: 'Selfie with ID', desc: 'Hold your ID next to your face, clearly visible' },
            ].map((doc) => (
              <div key={`kyc-${doc.key}`}>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  {doc.label}
                </label>
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  {doc.desc}
                </p>
                <label
                  className="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-150"
                  style={
                    kycFiles[doc.key]
                      ? { background: 'rgba(16,217,160,0.08)', border: '1px dashed var(--accent)' }
                      : { background: 'var(--muted)', border: '1px dashed var(--border)' }
                  }
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    // Backend integration point: upload to cloud storage (S3/GCS)
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setKycFiles((prev) => ({ ...prev, [doc.key]: file }));
                    }}
                  />
                  {kycFiles[doc.key] ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--accent)' }}>
                        <path d="M4 10l5 5 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-medium mt-1" style={{ color: 'var(--accent)' }}>
                        {kycFiles[doc.key]?.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--muted-foreground)' }}>
                        <path d="M10 3v10M6 7l4-4 4 4M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        Click to upload
                      </span>
                    </>
                  )}
                </label>
              </div>
            ))}

            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              You can skip KYC now and complete it later from your dashboard. Withdrawals will be locked until KYC is approved.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary flex-1"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create My Account 🚀'
              )}
            </button>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
            Already a member?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Sign in instead
            </button>
          </p>
        )}
      </form>
    </div>
  );
}