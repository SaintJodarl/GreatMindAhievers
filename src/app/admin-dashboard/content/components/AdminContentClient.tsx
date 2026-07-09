'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContentBlock {
  id: string;
  title: string;
  slug: string;
  body: string;
  isPublished: boolean;
  updatedAt: string | Date;
}

interface AdminContentClientProps {
  initialContents: ContentBlock[];
}

export default function AdminContentClient({ initialContents }: AdminContentClientProps) {
  const router = useRouter();
  const [contents, setContents] = useState<ContentBlock[]>(initialContents);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Only auto-generate slug if we are creating new content
    if (!activeId) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-'); // Collapse duplicate -
      setSlug(generated);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  const openCreateModal = () => {
    setActiveId(null);
    setTitle('');
    setSlug('');
    setBody('');
    setIsPublished(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (content: ContentBlock) => {
    setActiveId(content.id);
    setTitle(content.title);
    setSlug(content.slug);
    setBody(content.body);
    setIsPublished(content.isPublished);
    setIsEditOpen(true);
  };

  const openDeleteModal = (content: ContentBlock) => {
    setActiveId(content.id);
    setTitle(content.title);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !body.trim()) {
      showNotification('All fields are required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, body, isPublished }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create content block');

      showNotification('Content block created successfully', 'success');
      setIsCreateOpen(false);
      router.refresh();

      // Update local state temporarily
      setContents([data.content, ...contents]);
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    if (!title.trim() || !slug.trim() || !body.trim()) {
      showNotification('All fields are required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, body, isPublished }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update content block');

      showNotification('Content block updated successfully', 'success');
      setIsEditOpen(false);
      router.refresh();

      // Update local state
      setContents(contents.map((c) => (c.id === activeId ? data.content : c)));
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/content/${activeId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete content block');

      showNotification('Content block deleted successfully', 'success');
      setIsDeleteOpen(false);
      router.refresh();

      // Update local state
      setContents(contents.filter((c) => c.id !== activeId));
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500 mt-1">Manage system pages, terms, and announcements.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Create Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map((content) => (
          <div
            key={content.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow relative"
          >
            <div className="flex justify-between items-start mb-4">
              <h2
                className="text-xl font-bold text-gray-900 line-clamp-1 pr-6"
                title={content.title}
              >
                {content.title}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  content.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {content.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm font-mono text-gray-500 mb-4 bg-gray-50 px-2.5 py-1 rounded-lg w-max">
              /{content.slug}
            </p>
            <p className="text-sm text-gray-600 line-clamp-4 mb-6 leading-relaxed whitespace-pre-line">
              {content.body}
            </p>
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Updated {new Date(content.updatedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(content)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Edit Content"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => openDeleteModal(content)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Content"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {contents.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No content blocks found. Create one to get started.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Create Content Block</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms of Service"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. terms-of-service"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Enter the main body of this content block..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPublishedCreate"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="isPublishedCreate"
                  className="text-sm font-medium text-gray-700 select-none"
                >
                  Publish immediately (visible to members)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  <span>Create Content</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Edit Content Block</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms of Service"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. terms-of-service"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Enter the main body of this content block..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPublishedEdit"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="isPublishedEdit"
                  className="text-sm font-medium text-gray-700 select-none"
                >
                  Publish Block
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 pb-2 border-b border-gray-100">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold text-gray-900">Delete Content</h3>
            </div>

            <p className="text-gray-600 text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">&quot;{title}&quot;</span>? This action
              is permanent and cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                <span>Delete Block</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
