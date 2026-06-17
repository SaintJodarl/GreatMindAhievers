'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

interface UserInfo {
  name: string | null;
  email: string | null;
}

interface WalletInfo {
  user: UserInfo;
}

interface Transaction {
  id: string;
  amount: number;
  type: string; // CREDIT, DEBIT
  description: string | null;
  createdAt: string | Date;
  wallet: WalletInfo;
}

interface AdminWalletClientProps {
  initialTransactions: Transaction[];
}

export default function AdminWalletClient({ initialTransactions }: AdminWalletClientProps) {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesSearch = 
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.wallet.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.wallet.user.email || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet & Finance</h1>
          <p className="text-gray-500 mt-1">Monitor system-wide financial transactions.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search references or members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">System Audit Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Member</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Type</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Description</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{tx.wallet.user.name || 'GMA Member'}</p>
                    <p className="text-xs text-gray-500">{tx.wallet.user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`flex items-center gap-1.5 text-sm font-bold ${
                        tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownRight size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                      {tx.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tx.description}</td>
                  <td
                    className={`px-6 py-4 text-right font-bold ${
                      tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'} {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <ArrowUpRight className="text-gray-400" size={32} />
                      </div>
                      <p>No transactions match your search filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
