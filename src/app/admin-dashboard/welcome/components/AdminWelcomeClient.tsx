'use client';

import React, { useState } from 'react';
import { Plus, Mail, X, Loader2, AlertCircle, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WelcomeMessage {
  id: string;
  subject: string;
  content: string;
  isActive: boolean;
  updatedAt: string | Date;
}

interface AdminWelcomeClientProps {
  initialMessages: WelcomeMessage[];
}

export default function AdminWelcomeClient({ initialMessages }: AdminWelcomeClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<WelcomeMessage[]>(initialMessages);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSubject('');
    setContent('');
    setIsActive(true);
    setIsCreateOpen(true);
  };

  const openEditModal = (msg: WelcomeMessage) => {
    setActiveId(msg.id);
    setSubject(msg.subject);
    setContent(msg.content);
    setIsActive(msg.isActive);
    setIsEditOpen(true);
  };

  const openDeleteModal = (msg: WelcomeMessage) => {
    setActiveId(msg.id);
    setSubject(msg.subject);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      showNotification('Subject and content are required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create welcome message');

      showNotification('Welcome message created successfully', 'success');
      setIsCreateOpen(false);
      router.refresh();

      setMessages([data.messageRecord, ...messages]);
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    if (!subject.trim() || !content.trim()) {
      showNotification('Subject and content are required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/welcome/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update welcome message');

      showNotification('Welcome message updated successfully', 'success');
      setIsEditOpen(false);
      router.refresh();

      setMessages(messages.map(m => m.id === activeId ? data.messageRecord : m));
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
      const res = await fetch(`/api/admin/welcome/${activeId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete welcome message');

      showNotification('Welcome message deleted successfully', 'success');
      setIsDeleteOpen(false);
      router.refresh();

      setMessages(messages.filter(m => m.id !== activeId));
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome Messages</h1>
          <p className="text-gray-500 mt-1">Configure automated messages for new members.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Message
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Subject</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">{msg.subject}</span>
                        <span className="text-xs text-gray-500 line-clamp-1 max-w-lg mt-0.5">{msg.content}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        msg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(msg.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(msg)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(msg)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {messages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No welcome messages configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE WELCOME MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Create Welcome Message</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome to GreatMind Achievers!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Type the message body that will be sent/displayed to new members..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isActiveCreate"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveCreate" className="text-sm font-medium text-gray-700 select-none">
                  Set message as active
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
                  <span>Create Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WELCOME MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Edit Welcome Message</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome to GreatMind Achievers!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Type the message body..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700 select-none">
                  Active Message
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

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 pb-2 border-b border-gray-100">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold text-gray-900">Delete Message</h3>
            </div>

            <p className="text-gray-600 text-sm">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{subject}"</span>? This welcome message will be permanently removed.
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
                <span>Delete Message</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
