import { prisma } from '@/lib/prisma';
import React from 'react';
import { BarChart3, Download } from 'lucide-react';

export const metadata = {
  title: 'Reports & Analytics | Admin',
};

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate system reports and view analytics.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Download size={20} />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
             <BarChart3 size={32} />
           </div>
           <p className="text-gray-500 font-medium">Growth Chart Data Processing...</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
             <BarChart3 size={32} />
           </div>
           <p className="text-gray-500 font-medium">Financial Flow Processing...</p>
        </div>
      </div>
    </div>
  );
}
