'use client';

import { useState, useEffect } from 'react';
import { 
  getAuditLogsWithPagination, 
  exportAuditLogsToCSV, 
  getLogStatistics,
  LogFilters 
} from './actions';
import { EventType, EventCategory, EventStatus } from '@/lib/audit-logging';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<LogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, filters]);
  
  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogsWithPagination(filters, page, pageSize);
      setLogs(result.logs);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const result = await getLogStatistics();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };
  
  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportAuditLogsToCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export logs:', error);
    } finally {
      setExporting(false);
    }
  };
  
  const handleFilterChange = (key: keyof LogFilters, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };
  
  const handleSearch = () => {
    handleFilterChange('search', searchTerm);
  };
  
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400';
      case 'failure': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-neutral-600';
    }
  };

  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      user_activity: 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30',
      admin_activity: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      scholarship_lifecycle: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      payment: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      email: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
      system_error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-neutral-600 border border-gray-500/30';
  };
  
  return (
    <div className="min-h-screen bg-[#d1d5db] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Audit Logs</h1>
        <p className="text-neutral-600">Monitor and track all system activities</p>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-neutral-200 p-4 rounded-lg">
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <div className="text-neutral-600">Total Events</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.byStatus.success || 0}</div>
            <div className="text-neutral-600">Successful</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{stats.byStatus.failure || 0}</div>
            <div className="text-neutral-600">Failed</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{stats.byStatus.warning || 0}</div>
            <div className="text-neutral-600">Warnings</div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Event Type</label>
            <select
              className="w-full border border-neutral-200 bg-neutral-50 rounded px-3 py-2 text-neutral-900"
              value={filters.event_type || ''}
              onChange={(e) => handleFilterChange('event_type', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              <option value="user_activity">User Activity</option>
              <option value="admin_activity">Admin Activity</option>
              <option value="scholarship_lifecycle">Scholarship Lifecycle</option>
              <option value="payment">Payment</option>
              <option value="email">Email</option>
              <option value="system_error">System Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Status</label>
            <select
              className="w-full border border-neutral-200 bg-neutral-50 rounded px-3 py-2 text-neutral-900"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">User Email</label>
            <input
              type="text"
              className="w-full border border-neutral-200 bg-neutral-50 rounded px-3 py-2 text-neutral-900"
              placeholder="Search by email"
              value={filters.user_email || ''}
              onChange={(e) => handleFilterChange('user_email', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Resource Type</label>
            <input
              type="text"
              className="w-full border border-neutral-200 bg-neutral-50 rounded px-3 py-2 text-neutral-900"
              placeholder="Resource type"
              value={filters.resource_type || ''}
              onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-neutral-200 bg-neutral-50 rounded px-3 py-2 text-neutral-900"
              placeholder="Search description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="bg-[#10b981] text-black px-4 py-2 rounded hover:bg-white font-mono text-xs uppercase font-bold"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="bg-[#d1d5db] text-neutral-600 px-4 py-2 rounded hover:bg-neutral-50 border border-neutral-200"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-500 text-neutral-900 px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 font-mono text-xs uppercase font-bold"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Logs Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-600">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-600">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getEventTypeBadge(log.event_type)}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{log.event_action}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{log.user_email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {log.resource_type ? (
                        <div>
                          <div>{log.resource_type}</div>
                          <div className="text-neutral-500 text-xs">{log.resource_reference || log.resource_id || ''}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusColor(log.status)}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate text-neutral-900">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 text-neutral-900"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-neutral-900">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 text-neutral-900"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
