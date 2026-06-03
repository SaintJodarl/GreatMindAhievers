import React from 'react';
import { Files } from 'lucide-react';

export const metadata = {
  title: 'Documents | Verification',
};

export default function KycDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Documents</h1>
        <p className="text-gray-500 mt-1">View your submitted verification documents.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <Files size={32} />
        </div>
        <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
      </div>
    </div>
  );
}
