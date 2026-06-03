import React from 'react';
import { HelpCircle, Search } from 'lucide-react';

export const metadata = {
  title: 'Help Center | Support',
};

export default function HelpCenterPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Help Center</h1>
          <p className="text-gray-500 mt-1">Browse frequently asked questions and guides.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 bg-indigo-600 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">How can we help you today?</h2>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
              type="text" 
              placeholder="Search for articles..." 
              className="w-full pl-12 pr-4 py-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-indigo-400/50"
            />
          </div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <HelpCircle size={32} />
          </div>
          <p className="text-gray-500 font-medium">Knowledge base content is being updated.</p>
        </div>
      </div>
    </div>
  );
}
