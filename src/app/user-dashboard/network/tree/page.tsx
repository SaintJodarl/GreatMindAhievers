import React from 'react';
import { Network } from 'lucide-react';

export const metadata = {
  title: 'Binary Tree | My Network',
};

export default function BinaryTreePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Binary Tree</h1>
        <p className="text-gray-500 mt-1">Visualize and manage your downline network placement.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <Network size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Binary Tree Visualization</h2>
        <p className="text-gray-500 max-w-md text-center mb-6">
          The interactive binary tree is currently being prepared. You'll soon be able to view your left and right legs visually.
        </p>
        <span className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-full">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
