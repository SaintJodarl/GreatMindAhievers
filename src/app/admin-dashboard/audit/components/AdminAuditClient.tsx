'use client';

import React, { useState } from 'react';
import { History, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
}

interface AdminAuditClientProps {
  initialLogs: AuditLog[];
}

export default function AdminAuditClient({ initialLogs }: AdminAuditClientProps) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      log.adminId.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.ipAddress || '').toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  // Extract unique action types for filter options
  const actionTypes = Array.from(new Set(logs.map((log) => log.action)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track administrative actions and system events.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-gray-700 max-w-[180px]"
          >
            <option value="all">All Actions</option>
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Admin ID</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Action</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Details</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 font-mono">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{log.adminId}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100">
                      {log.action}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate"
                    title={log.details || ''}
                  >
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <History className="text-gray-400" size={32} />
                      </div>
                      <p>No audit logs match your search.</p>
                    </div>
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
