'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ActivatePage() {
  const router = useRouter();
  const { checkSession } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter an activation code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api('/api/user/activation/submit', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to activate account');
      }

      setSuccess(data.message || 'Account activated successfully!');
      await checkSession(); // refresh user session
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/user-dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-8 bg-slate-950/40 p-8 md:p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
        
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Activate Account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your activation code to unlock full platform features.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 animate-slide-up">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 animate-slide-up">
            <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Activation Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. GMA-1234-ABCD"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-lg font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase tracking-widest"
              disabled={loading || !!success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-700/60 disabled:cursor-not-allowed font-bold text-white transition-colors shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Activate Now
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800">
          <button 
            onClick={() => router.push('/user-dashboard')}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Skip for now &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
