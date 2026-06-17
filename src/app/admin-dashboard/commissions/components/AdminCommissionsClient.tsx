'use client';

import React, { useState } from 'react';
import { Settings, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommissionSetting {
  id: string;
  type: string; // DIRECT, PAIRING, LEADERSHIP
  percentage: number | null;
  fixedAmount: number | null;
  isActive: boolean;
  updatedAt: string | Date;
}

interface AdminCommissionsClientProps {
  initialCommissions: CommissionSetting[];
}

export default function AdminCommissionsClient({ initialCommissions }: AdminCommissionsClientProps) {
  const router = useRouter();
  const [commissions, setCommissions] = useState<CommissionSetting[]>(initialCommissions);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<CommissionSetting | null>(null);

  // Form Field States
  const [percentage, setPercentage] = useState<number | ''>('');
  const [fixedAmount, setFixedAmount] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  const openModal = (comm: CommissionSetting) => {
    setSelectedSetting(comm);
    setPercentage(comm.percentage !== null ? comm.percentage : '');
    setFixedAmount(comm.fixedAmount !== null ? comm.fixedAmount : '');
    setIsActive(comm.isActive);
    setIsOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetting) return;

    setLoading(true);
    setError(null);

    const payload: any = {
      id: selectedSetting.id,
      isActive,
    };

    if (selectedSetting.percentage !== null) {
      payload.percentage = percentage === '' ? null : Number(percentage);
    }
    if (selectedSetting.fixedAmount !== null) {
      payload.fixedAmount = fixedAmount === '' ? null : Number(fixedAmount);
    }

    try {
      const res = await fetch('/api/admin/commissions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update commission setting');

      showNotification(`${selectedSetting.type} commission settings updated successfully`, 'success');
      setIsOpen(false);
      router.refresh();

      // Update local state
      setCommissions(commissions.map(c => c.id === selectedSetting.id ? data.setting : c));
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Settings</h1>
          <p className="text-gray-500 mt-1">Configure compensation plan payouts and bonuses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commissions.map((comm) => (
          <div
            key={comm.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Settings size={24} />
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  comm.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {comm.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">{comm.type} BONUS</h2>
            
            <div className="mt-auto pt-4 border-t border-gray-50">
              {comm.percentage !== null && (
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Commission rate</span>
                  <p className="text-3xl font-black text-indigo-600 mt-0.5">
                    {comm.percentage}%{' '}
                    <span className="text-sm font-medium text-gray-500">of volume</span>
                  </p>
                </div>
              )}
              {comm.fixedAmount !== null && (
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Flat Reward</span>
                  <p className="text-3xl font-black text-indigo-600 mt-0.5">
                    ₦{comm.fixedAmount.toLocaleString()}{' '}
                    <span className="text-sm font-medium text-gray-500">fixed amount</span>
                  </p>
                </div>
              )}
              <span className="text-[11px] text-gray-400 block mt-2">
                Last updated: {new Date(comm.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <button
              onClick={() => openModal(comm)}
              className="mt-6 w-full py-2.5 bg-gray-50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-xl font-semibold transition-all border border-gray-200 hover:border-indigo-200"
            >
              Edit Settings
            </button>
          </div>
        ))}

        {commissions.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No commission settings configured yet.
          </div>
        )}
      </div>

      {/* EDIT SETTINGS MODAL */}
      {isOpen && selectedSetting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Edit {selectedSetting.type} Settings</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {selectedSetting.percentage !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="Enter percentage rate..."
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {selectedSetting.fixedAmount !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₦)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="Enter fixed bonus reward..."
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isActiveCommission"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveCommission" className="text-sm font-medium text-gray-700 select-none">
                  Enable this bonus type
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
