import { prisma } from '@/lib/prisma';
import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Content Management | Admin',
};

export default async function ContentPage() {
  const contents = await prisma.content.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500 mt-1">Manage system pages, terms, and announcements.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus size={20} />
          Create Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map((content) => (
          <div key={content.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{content.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                content.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {content.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm font-mono text-gray-500 mb-4">/{content.slug}</p>
            <p className="text-sm text-gray-600 line-clamp-3 mb-6">
              {content.body}
            </p>
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Updated {content.updatedAt.toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Edit3 size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {contents.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No content blocks found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
