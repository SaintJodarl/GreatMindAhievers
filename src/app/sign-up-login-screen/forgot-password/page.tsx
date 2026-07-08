'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit reset request');
      }

      setSuccess(data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-full max-w-md bg-opacity-40 backdrop-blur-md rounded-2xl p-8 border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(108,71,255,0.1)', color: 'var(--primary)' }}
          >
            <KeyRound size={26} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Request Password Reset
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Enter your registered email below to request assistance
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div
            className="p-3.5 rounded-lg mb-5 text-sm flex items-start gap-2.5"
            style={{
              background: 'var(--negative-bg)',
              border: '1px solid rgba(255,77,106,0.25)',
              color: 'var(--negative)',
            }}
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="p-3.5 rounded-lg mb-5 text-sm flex items-start gap-2.5"
            style={{
              background: 'var(--positive-bg)',
              border: '1px solid rgba(16,217,160,0.25)',
              color: 'var(--positive)',
            }}
          >
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting Request...
              </>
            ) : (
              'Request Password Reset'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => router.push('/sign-up-login-screen')}
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
