'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, Send, Mail, MessageSquare } from 'lucide-react';
import { generateReferralLink } from '@/lib/referral-link';

interface ReferralLinkClientProps {
  referralCode: string;
}

export default function ReferralLinkClient({ referralCode }: ReferralLinkClientProps) {
  const [position, setPosition] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [copied, setCopied] = useState(false);
  const referralLink = generateReferralLink(referralCode) + `&position=${position}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareText = `Join my team on Great Mind Achievers (GMA) MLM Network! Register here: ${referralLink}`;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join my team on Great Mind Achievers (GMA) MLM Network!')}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join my team on Great Mind Achievers (GMA) MLM Network!')}`,
    email: `mailto:?subject=${encodeURIComponent('Invitation to join Great Mind Achievers Network')}&body=${encodeURIComponent(shareText)}`,
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">Configure Referral Link</h2>
        <p className="mb-5 text-sm leading-relaxed text-gray-550">
          Set your preferred position for new users registering through your link. When someone
          signs up, the system will place them on the side you choose.
        </p>

        {/* Position Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2.5">
            Default Binary Position
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setPosition('LEFT')}
              className={`min-h-11 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                position === 'LEFT'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100'
              }`}
            >
              Left Leg
            </button>
            <button
              onClick={() => setPosition('RIGHT')}
              className={`min-h-11 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                position === 'RIGHT'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100'
              }`}
            >
              Right Leg
            </button>
          </div>
        </div>

        {/* Link Output and Copy */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Your Invitation Link</label>
          <div className="flex min-w-0 flex-col gap-2 min-[430px]:flex-row">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-600 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 size={18} className="text-indigo-650" />
          Quick Share
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* WhatsApp */}
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-24 flex-col items-center justify-center rounded-lg border border-gray-150 p-3 text-gray-750 transition-all hover:border-emerald-200 hover:bg-emerald-50/30 hover:text-emerald-700"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <MessageSquare size={20} />
            </div>
            <span className="text-xs font-semibold">WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={shareLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-24 flex-col items-center justify-center rounded-lg border border-gray-150 p-3 text-gray-750 transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:text-blue-700"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <Send size={20} />
            </div>
            <span className="text-xs font-semibold">Telegram</span>
          </a>

          {/* Twitter / X */}
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-24 flex-col items-center justify-center rounded-lg border border-gray-150 p-3 text-gray-750 transition-all hover:border-gray-300 hover:bg-gray-55/30 hover:text-gray-900"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <span className="text-sm font-black font-sans">X</span>
            </div>
            <span className="text-xs font-semibold">Twitter / X</span>
          </a>

          {/* Email */}
          <a
            href={shareLinks.email}
            className="group flex min-h-24 flex-col items-center justify-center rounded-lg border border-gray-150 p-3 text-gray-750 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-700"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <Mail size={20} />
            </div>
            <span className="text-xs font-semibold">Email</span>
          </a>
        </div>
      </div>
    </div>
  );
}
