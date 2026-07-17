'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LifeBuoy, Plus, ArrowLeft, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export default function SupportTicketsPage() {
  // Navigation / View states
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Tickets List State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const limit = 6;

  // Single Ticket / Message Details State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create Ticket State
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // General error state
  const [error, setError] = useState<string | null>(null);

  // Fetch tickets list
  const fetchTickets = async (page = 1) => {
    try {
      setTicketsLoading(true);
      setError(null);
      const res = await fetch(`/api/user/support/tickets?limit=${limit}&page=${page}`);
      if (!res.ok) {
        throw new Error('Failed to load tickets');
      }
      const data = await res.json();
      setTickets(data.tickets);
      setTotalCount(data.totalCount);
      setCurrentPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Error fetching support tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      setError(null);
      const res = await fetch(`/api/user/support/tickets/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load ticket details');
      }
      const data = await res.json();
      setSelectedTicket(data);
    } catch (err: any) {
      setError(err.message || 'Error loading ticket details');
      setView('list');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchTickets(currentPage);
    }
  }, [view, currentPage]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (selectedTicket?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Handle click on ticket in the list
  const handleViewTicket = (id: string) => {
    setSelectedTicketId(id);
    setView('detail');
    fetchTicketDetails(id);
  };

  // Handle submit reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setReplySubmitting(true);
      const res = await fetch(`/api/user/support/tickets/${selectedTicketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to send reply');
      }

      setReplyText('');
      // Reload ticket details to show new message
      await fetchTicketDetails(selectedTicketId);
    } catch (err: any) {
      alert(err.message || 'Could not send reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle create ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      setCreateError('Please fill in all fields.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const res = await fetch('/api/user/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: initialMessage }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to create support ticket');
      }

      setSubject('');
      setInitialMessage('');
      setView('list');
      setCurrentPage(1);
      fetchTickets(1);
    } catch (err: any) {
      setCreateError(err.message || 'Could not create support ticket');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6', text: 'Open' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', text: 'In Progress' };
      case 'RESOLVED':
        return { bg: 'rgba(16,217,160,0.08)', color: 'var(--accent)', text: 'Resolved' };
      case 'CLOSED':
        return { bg: 'rgba(107,114,128,0.08)', color: '#6B7280', text: 'Closed' };
      default:
        return { bg: 'rgba(107,114,128,0.08)', color: '#6B7280', text: status };
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      {view === 'list' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Support Tickets
            </h1>
            <p className="text-gray-500 mt-1">Get help from the GMA support team.</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus size={20} />
            New Ticket
          </button>
        </div>
      )}

      {view === 'create' && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create Support Ticket
            </h1>
            <p className="text-gray-500 mt-0.5">Submit details of your inquiry or issue.</p>
          </div>
        </div>
      )}

      {view === 'detail' && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {selectedTicket ? selectedTicket.subject : 'Loading Ticket...'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Ticket ID: {selectedTicketId}
              </p>
            </div>
          </div>
          {selectedTicket && (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-full border"
              style={{
                background: getStatusStyle(selectedTicket.status).bg,
                color: getStatusStyle(selectedTicket.status).color,
                borderColor: getStatusStyle(selectedTicket.status).color + '20',
              }}
            >
              {getStatusStyle(selectedTicket.status).text}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Main Body Switcher */}
      {view === 'list' && (
        <>
          {ticketsLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mb-2" />
              <p className="text-sm text-gray-500">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <LifeBuoy size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Support Tickets</h2>
              <p className="text-gray-500 max-w-sm text-center mb-6 text-sm">
                You don&apos;t have any support tickets yet. If you have questions or encountered an
                issue, create a ticket.
              </p>
              <button
                onClick={() => setView('create')}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition duration-150 shadow-sm text-sm"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="space-y-3 p-4 md:hidden">
                {tickets.map((ticket) => {
                  const status = getStatusStyle(ticket.status);
                  return (
                    <article
                      key={ticket.id}
                      className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {ticket.subject}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {ticket._count?.messages || 1} msg(s)
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            background: status.bg,
                            color: status.color,
                            borderColor: status.color + '20',
                          }}
                        >
                          {status.text}
                        </span>
                      </div>

                      <div className="mt-3 rounded-md bg-gray-50 p-2 text-xs">
                        <p className="font-semibold text-gray-400">Last Activity</p>
                        <p className="mt-0.5 font-medium text-gray-700">
                          {new Date(ticket.updatedAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewTicket(ticket.id)}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        View Thread
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tickets.map((ticket) => {
                      const status = getStatusStyle(ticket.status);
                      return (
                        <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-800 text-sm max-w-xs truncate">
                            {ticket.subject}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border"
                              style={{
                                background: status.bg,
                                color: status.color,
                                borderColor: status.color + '20',
                              }}
                            >
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(ticket.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-600">
                            {ticket._count?.messages || 1} msg(s)
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleViewTicket(ticket.id)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              View Thread
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <span className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} ({totalCount} total tickets)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="min-h-10 rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="min-h-10 rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === 'create' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
          {createError && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-700 text-sm border-l-4 border-red-500 rounded flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subject / Inquiry Title
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What do you need assistance with?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Describe your request
              </label>
              <textarea
                required
                rows={5}
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detail your questions, issue, transaction details, or inquiries..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          {/* Messages Thread area */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px] bg-gray-50/50">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                <span className="text-xs text-gray-400">Loading conversation...</span>
              </div>
            ) : selectedTicket?.messages?.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-10">No messages in this ticket.</p>
            ) : (
              selectedTicket?.messages?.map((msg: Message) => {
                const isMe = msg.senderId === selectedTicket.userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {isMe ? 'You' : 'Support Team'} · {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input form */}
          {selectedTicket && selectedTicket.status !== 'CLOSED' ? (
            <form
              onSubmit={handleSendReply}
              className="p-4 border-t border-gray-100 bg-white flex gap-3"
            >
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={replySubmitting || !replyText.trim()}
                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replySubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          ) : (
            selectedTicket && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-gray-400" />
                This ticket has been resolved or closed. If you need further help, please create a
                new ticket.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
