import { prisma } from '@/lib/prisma';
import React from 'react';
import { Users, Wallet, CreditCard, Activity } from 'lucide-react';
import AdminOverviewClient from './components/AdminOverviewClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Admin Overview | GMA Network',
};

async function getStats() {
  const [totalMembers, totalWalletBalance, pendingWithdrawals, pendingKyc] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER' } }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.kYCSubmission.count({ where: { status: 'SUBMITTED' } }),
  ]);

  return {
    totalMembers,
    totalWalletBalance: totalWalletBalance._sum.balance || 0,
    pendingWithdrawals,
    pendingKyc,
  };
}

export default async function AdminDashboardOverview() {
  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Wallet size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">System Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              ₦{stats.totalWalletBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CreditCard size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Activity size={28} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending KYC</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingKyc}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <AdminOverviewClient />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Activity Chart (Coming Soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

