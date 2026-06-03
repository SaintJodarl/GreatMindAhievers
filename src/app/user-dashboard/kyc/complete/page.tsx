import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Complete KYC | Verification',
};

export default function CompleteKycPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Complete KYC</h1>
        <p className="text-gray-500 mt-1">Submit your identity documents for verification.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Submission Form</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="As it appears on your ID" disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select className="w-full border border-gray-200 rounded-lg p-2.5" disabled>
                <option>National ID</option>
                <option>Passport</option>
                <option>Driver's License</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5" placeholder="ID Number" disabled />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
              <span className="text-sm text-gray-500">Drag and drop your document here</span>
            </div>
          </div>
          <button type="button" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold opacity-50 cursor-not-allowed">
            Submit Documents
          </button>
        </form>
      </div>
    </div>
  );
}
