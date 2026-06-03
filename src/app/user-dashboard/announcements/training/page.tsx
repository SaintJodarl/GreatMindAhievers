import React from 'react';
import { GraduationCap, PlayCircle, FileText } from 'lucide-react';

export const metadata = {
  title: 'Training Resources | Announcements',
};

export default function TrainingResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Training Resources</h1>
        <p className="text-gray-500 mt-1">Learn how to build and scale your binary network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Getting Started Guide', type: 'Document', icon: FileText },
          { title: 'Binary Placement Strategy', type: 'Video', icon: PlayCircle },
          { title: 'Maximizing Earnings', type: 'Webinar', icon: GraduationCap },
        ].map((resource, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <resource.icon size={32} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{resource.title}</h3>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{resource.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
