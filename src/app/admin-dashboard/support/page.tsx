import { prisma } from '@/lib/prisma';
import React from 'react';
import { MessageSquare, Clock, Search } from 'lucide-react';

export const metadata = {
  title: 'Support Management | Admin',
};

export default async function SupportPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      _count: {
        select: { messages: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Manage and respond to member support queries.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tickets..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Ticket ID</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Member</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Subject</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Messages</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600">
                    #{ticket.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{ticket.user.name}</p>
                    <p className="text-xs text-gray-500">{ticket.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MessageSquare size={16} />
                      {ticket._count.messages}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      {ticket.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
              
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
