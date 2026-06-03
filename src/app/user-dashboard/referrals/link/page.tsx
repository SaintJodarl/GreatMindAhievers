import React from 'react';
import { Link as LinkIcon, Copy } from 'lucide-react';

export const metadata = {
  title: 'Referral Link | Referral Center',
};

export default function ReferralLinkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referral Link</h1>
        <p className="text-gray-500 mt-1">Share your unique link to invite new members.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <LinkIcon size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Unique Link</h2>
        <p className="text-gray-500 mb-6">
          Anyone who registers using this link will automatically be placed in your downline according to your placement settings.
        </p>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-600 font-mono text-sm"
            value="https://gma.network/register?ref=GMA-MBR1"
            readOnly
          />
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium">
            <Copy size={18} />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
