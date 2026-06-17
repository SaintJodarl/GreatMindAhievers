'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, Search, X, Loader2, Send, ShieldAlert, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
}

interface TicketMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  createdAt: string;
  updatedAt: string;
  user: UserInfo;
  _count: {
    messages: number;
  };
}

interface SelectedTicketDetails extends Ticket {
  messages: TicketMessage[];
}

interface AdminSupportClientProps {
  initialTickets: Ticket[];
}

export default function AdminSupportClient({ initialTickets }: AdminSupportClientProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Ticket state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<SelectedTicketDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Reply form state
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch ticket messages and detail view when a ticket is clicked
  useEffect(() => {
    if (!selectedTicketId) {
      setTicketDetails(null);
      return;
    }

    const fetchTicketDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await fetch(`/api/admin/support/tickets/${selectedTicketId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load ticket details');
        
        setTicketDetails(data.ticket);
        setSelectedStatus(data.ticket.status);
      } catch (err: any) {
        showNotification(err.message || 'Could not fetch ticket details', 'error');
        setSelectedTicketId(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchTicketDetails();
  }, [selectedTicketId]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketDetails?.messages]);

  // Handle Reply Submit
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage, status: selectedStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reply');

      showNotification('Reply sent successfully', 'success');
      setReplyMessage('');

      // Update local ticket details
      if (ticketDetails) {
        setTicketDetails({
          ...ticketDetails,
          status: data.ticket.status,
          messages: [...ticketDetails.messages, data.ticketMessage],
        });
      }

      // Update tickets list state
      setTickets(tickets.map(t => t.id === selectedTicketId ? {
        ...t,
        status: data.ticket.status,
        _count: { messages: (t._count?.messages || 0) + 1 }
      } : t));

      router.refresh();
    } catch (err: any) {
      showNotification(err.message || 'Failed to submit response', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (ticket.user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Alert Notifications */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl shadow-sm animate-fade-in flex-shrink-0">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl shadow-sm animate-fade-in flex-shrink-0">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Manage and respond to member support queries.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex gap-6 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Left Side: Tickets List */}
        <div className={`flex-1 flex flex-col min-h-0 border-r border-gray-100 ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm">
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Ticket</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Subject</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Messages</th>
                  <th className="px-6 py-4 font-semibold text-sm text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                      selectedTicketId === ticket.id ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-mono text-indigo-600 font-semibold">#{ticket.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 font-medium">{ticket.user.name || 'GMA Member'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-[180px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ticket.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : ticket.status === 'RESOLVED'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MessageSquare size={16} />
                        {ticket._count?.messages || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-gray-400" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No support tickets found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Conversation Thread */}
        <div className={`w-full md:w-[450px] lg:w-[550px] flex flex-col min-h-0 ${selectedTicketId ? 'flex' : 'hidden md:flex bg-gray-50/50 justify-center items-center p-8 text-center text-gray-400'}`}>
          {selectedTicketId ? (
            loadingDetails ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-gray-500 font-medium text-sm">Loading message history...</p>
              </div>
            ) : ticketDetails ? (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-indigo-600 font-bold">#{ticketDetails.id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-400">• Created {new Date(ticketDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg truncate mt-0.5" title={ticketDetails.subject}>
                      {ticketDetails.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={14} className="text-gray-400" />
                      <p className="text-xs text-gray-600 font-medium">
                        {ticketDetails.user.name || 'GMA Member'} ({ticketDetails.user.email || 'No Email'})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0 md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-gray-50/30">
                  {ticketDetails.messages.map((msg) => {
                    const isAdminSender = msg.senderId !== ticketDetails.user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isAdminSender ? 'ml-auto items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed whitespace-pre-line ${
                            isAdminSender
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-medium px-1">
                          {isAdminSender && (
                            <span className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <ShieldAlert size={8} /> Admin
                            </span>
                          )}
                          <span>
                            {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Reply & Status Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status:</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        required
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Write a response to this member..."
                        className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                      />
                      <button
                        type="submit"
                        disabled={submittingReply || !replyMessage.trim()}
                        className="absolute right-3.5 bottom-4 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                        title="Send reply"
                      >
                        {submittingReply ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-medium">Failed to retrieve ticket information.</p>
            )
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="text-gray-400" size={32} />
              </div>
              <h3 className="font-bold text-gray-700">No Ticket Selected</h3>
              <p className="text-sm text-gray-500 max-w-xs mt-1">Select a support ticket from the list to view its message thread and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
