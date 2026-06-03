import React from 'react';
import { Megaphone } from 'lucide-react';

export const metadata = {
  title: 'Company News | Announcements',
};

export default function CompanyNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Company News</h1>
        <p className="text-gray-500 mt-1">Stay updated with the latest news from GMA Network.</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Welcome to the New GMA Network!</h2>
              <p className="text-xs text-gray-500">Posted on June 3, 2026</p>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We are thrilled to launch the new and improved Great Mind Achievers platform. 
            Enjoy a smoother, faster, and more robust binary network experience.
          </p>
        </div>
      </div>
    </div>
  );
}
