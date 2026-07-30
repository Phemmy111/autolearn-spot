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
  
  const handleFilterChange = (key: keyof LogFilters, value: any) => {
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
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };
  
  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      user_activity: 'bg-blue-100 text-blue-800',
      admin_activity: 'bg-purple-100 text-purple-800',
      scholarship_lifecycle: 'bg-green-100 text-green-800',
      payment: 'bg-yellow-100 text-yellow-800',
      email: 'bg-pink-100 text-pink-800',
      system_error: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
        <p className="text-gray-600">Monitor and track all system activities</p>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-600">Total Events</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.success || 0}</div>
            <div className="text-gray-600">Successful</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.byStatus.failure || 0}</div>
            <div className="text-gray-600">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.warning || 0}</div>
            <div className="text-gray-600">Warnings</div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">User Email</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Search by email"
              value={filters.user_email || ''}
              onChange={(e) => handleFilterChange('user_email', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Resource Type</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Resource type"
              value={filters.resource_type || ''}
              onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Search description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getEventTypeBadge(log.event_type)}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{log.event_action}</td>
                    <td className="px-4 py-3 text-sm">{log.user_email || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.resource_type ? (
                        <div>
                          <div>{log.resource_type}</div>
                          <div className="text-gray-500 text-xs">{log.resource_reference || log.resource_id || ''}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusColor(log.status)}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">
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
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
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
