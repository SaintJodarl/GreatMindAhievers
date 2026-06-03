import React from 'react';
import { LifeBuoy, Plus } from 'lucide-react';

export const metadata = {
  title: 'Support Tickets | Support',
};

export default function SupportTicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Get help from the GMA support team.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-indigo-700 shadow-sm">
          <Plus size={20} />
          New Ticket
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <LifeBuoy size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Open Tickets</h2>
        <p className="text-gray-500 max-w-md text-center">
          You don't have any active support requests. If you need assistance, create a new ticket.
        </p>
      </div>
    </div>
  );
}
