'use client';

import React, { useState, useEffect } from 'react';
import { GitMerge, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function PlacementManagerPage() {
  const [preferredPosition, setPreferredPosition] = useState<string>('LEFT');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlacementSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api('/api/user/registration/placement');
        if (!res.ok) {
          throw new Error('Failed to load placement configuration');
        }
        const data = await res.json();
        setPreferredPosition(data.preferredPosition || 'LEFT');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while loading settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlacementSettings();
  }, []);

  const handleSaveSettings = async (position: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api('/api/user/registration/placement', {
        method: 'POST',
        body: JSON.stringify({ preferredPosition: position }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save settings.');
      }

      setPreferredPosition(position);
      setSuccess(
        `Placement preference updated to ${position === 'LEFT' ? 'Left Leg' : 'Right Leg'} successfully!`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Placement Manager</h1>
        <p className="text-gray-500 mt-1">Configure default placement leg for new referrals.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-150">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <GitMerge size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Placement Settings</h2>
            <p className="text-sm text-gray-500">
              Set the leg where new members will be placed by default when they register.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Leg Card */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveSettings('LEFT')}
            className={`flex flex-col items-center justify-center p-8 border rounded-2xl transition-all text-center ${
              preferredPosition === 'LEFT'
                ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-600/5 ring-1 ring-indigo-500'
                : 'border-gray-200 hover:bg-gray-50/55'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-4 ${
                preferredPosition === 'LEFT'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              L
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Left Leg</h3>
            <p className="text-xs text-gray-500 max-w-[200px]">
              New signups will be placed down your left binary leg.
            </p>
          </button>

          {/* Right Leg Card */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveSettings('RIGHT')}
            className={`flex flex-col items-center justify-center p-8 border rounded-2xl transition-all text-center ${
              preferredPosition === 'RIGHT'
                ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-600/5 ring-1 ring-indigo-500'
                : 'border-gray-200 hover:bg-gray-50/55'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-4 ${
                preferredPosition === 'RIGHT'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              R
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Right Leg</h3>
            <p className="text-xs text-gray-500 max-w-[200px]">
              New signups will be placed down your right binary leg.
            </p>
          </button>
        </div>

        {submitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin text-indigo-600 h-4 w-4" />
            Updating placement settings...
          </div>
        )}
      </div>
    </div>
  );
}
