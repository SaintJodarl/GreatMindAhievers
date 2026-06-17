'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode, Download, Share2 } from 'lucide-react';

interface ReferralCodeClientProps {
  referralCode: string;
}

export default function ReferralCodeClient({ referralCode }: ReferralCodeClientProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referralLink = `${origin || 'https://gma.network'}/sign-up-login-screen?mode=register&ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralLink)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GMA-Referral-QR-${referralCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code: ', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
      {/* Left panel: Referral Code & Copy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mb-6">
            <Share2 size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Manual Referral Code</h2>
          <p className="text-gray-550 text-sm mb-8">
            When prospective members register manually on the GMA Network website, they can input
            this unique code in the "Sponsor Code" field.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Your Sponsor Code
          </span>
          <span className="text-3xl font-black text-indigo-650 tracking-wider font-mono select-all">
            {referralCode}
          </span>

          <button
            onClick={handleCopy}
            className={`mt-4 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              copied
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right panel: QR Code & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mb-6">
          <QrCode size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Referral QR Code</h2>
        <p className="text-gray-550 text-sm mb-6">
          New members can scan this QR code with their mobile device camera to open the registration
          page directly with your sponsor code prefilled.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 border-2 border-dashed border-gray-250 rounded-2xl mb-6 flex items-center justify-center">
          {origin ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${referralLink}`}
              className="w-48 h-48 object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-50 flex items-center justify-center text-gray-400">
              Generating...
            </div>
          )}
        </div>

        <button
          onClick={handleDownloadQR}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 w-full sm:w-auto"
        >
          <Download size={16} />
          Download QR Image
        </button>
      </div>
    </div>
  );
}
