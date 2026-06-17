'use client';

import React, { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Account & KYC',
    question: 'Why do I need to complete KYC verification?',
    answer:
      'KYC (Know Your Customer) verification is required to verify your legal identity. This protects our community from fraud and ensures compliance with financial regulations. You must complete KYC to enable withdrawals and qualify for higher leadership ranks.',
  },
  {
    category: 'Account & KYC',
    question: 'How long does KYC verification take?',
    answer:
      'Once you submit your documents (ID card and selfie), our compliance team usually reviews and approves them within 24 to 48 hours. You will receive an email notification and see your status change in the KYC dashboard.',
  },
  {
    category: 'Account & KYC',
    question: 'What types of identification documents are accepted?',
    answer:
      "We accept National Identification Numbers (NIN), Bank Verification Numbers (BVN), International Passports, and Driver's Licenses. The details on your ID must match the legal name on your profile.",
  },
  {
    category: 'Network & Binary',
    question: 'How does the binary tree placement work?',
    answer:
      'When you register a new member, they are placed either on your Left leg or your Right leg. The binary tree structure helps distribute sales volume (PV) throughout your network, which is used to calculate pairing bonuses.',
  },
  {
    category: 'Network & Binary',
    question: 'What is PV (Point Value)?',
    answer:
      'PV stands for Point Value. Every registration or product sale in your organization generates PV. The accumulation of PV in your left and right legs determines your qualification for binary cycles and commissions.',
  },
  {
    category: 'Earnings & Withdrawals',
    question: 'When are commission payouts calculated?',
    answer:
      'Direct referral bonuses are credited to your wallet instantly upon successful registration. Pairing and leadership bonuses are calculated at the end of each commission cycle (weekly or monthly, depending on network configurations).',
  },
  {
    category: 'Earnings & Withdrawals',
    question: 'How do I request a withdrawal of my earnings?',
    answer:
      'Navigate to the Withdrawals section under your wallet, enter your bank payout details and the amount you wish to withdraw, and submit. Payouts are processed on business days and typically arrive in your account within 24 hours.',
  },
  {
    category: 'Earnings & Withdrawals',
    question: 'Is there a minimum withdrawal limit?',
    answer:
      'Yes, the minimum withdrawal limit is ₦5,000. All withdrawals must be requested to bank accounts registered in the verified KYC name.',
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Account & KYC', 'Network & Binary', 'Earnings & Withdrawals'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Help Center</h1>
          <p className="text-gray-500 mt-1">Browse frequently asked questions and guides.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner with Search */}
        <div className="p-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">How can we help you today?</h2>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpandedIndex(null);
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 shadow-inner"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setExpandedIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="p-6 md:p-8 space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <AlertCircle size={32} className="text-gray-400 mb-2" />
              <p className="font-semibold text-sm">No matching questions found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with other keywords or change the category.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:border-gray-200 transition-colors"
                >
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-800 text-sm md:text-base hover:bg-gray-50/50 transition-colors focus:outline-none"
                  >
                    <span className="pr-4">{faq.question}</span>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-indigo-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-600 border-t border-gray-50 bg-gray-50/30 leading-relaxed">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600">
                        <BookOpen size={12} />
                        <span>Category: {faq.category}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
