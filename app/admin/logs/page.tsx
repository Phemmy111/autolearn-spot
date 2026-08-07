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
      default: return 'text-[text-[var(--text-muted)]]';
    }
  };

  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      user_activity: 'bg-[text-[var(--primary)]]/20 text-[text-[var(--primary)]] border border-[text-[var(--primary)]]/30',
      admin_activity: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      scholarship_lifecycle: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      payment: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      email: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
      system_error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-[text-[var(--text-muted)]] border border-gray-500/30';
  };
  
  return (
    <div className="min-h-screen bg-[bg-[var(--background)]] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Audit Logs</h1>
        <p className="text-[text-[var(--text-muted)]]">Monitor and track all system activities</p>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
            <div className="text-[text-[var(--text-muted)]]">Total Events</div>
          </div>
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.byStatus.success || 0}</div>
            <div className="text-[text-[var(--text-muted)]]">Successful</div>
          </div>
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{stats.byStatus.failure || 0}</div>
            <div className="text-[text-[var(--text-muted)]]">Failed</div>
          </div>
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{stats.byStatus.warning || 0}</div>
            <div className="text-[text-[var(--text-muted)]]">Warnings</div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Event Type</label>
            <select
              className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded px-3 py-2 text-[var(--text-primary)]"
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
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
            <select
              className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded px-3 py-2 text-[var(--text-primary)]"
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
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">User Email</label>
            <input
              type="text"
              className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded px-3 py-2 text-[var(--text-primary)]"
              placeholder="Search by email"
              value={filters.user_email || ''}
              onChange={(e) => handleFilterChange('user_email', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Resource Type</label>
            <input
              type="text"
              className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded px-3 py-2 text-[var(--text-primary)]"
              placeholder="Resource type"
              value={filters.resource_type || ''}
              onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded px-3 py-2 text-[var(--text-primary)]"
              placeholder="Search description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="bg-[text-[var(--primary)]] text-black px-4 py-2 rounded hover:bg-white font-mono text-xs uppercase font-bold"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="bg-[border-[var(--border-default)]] text-[text-[var(--text-muted)]] px-4 py-2 rounded hover:bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]]"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-500 text-[var(--text-primary)] px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 font-mono text-xs uppercase font-bold"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Logs Table */}
      <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[bg-[var(--card)]]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[text-[var(--text-muted)]]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[border-[var(--border-default)]]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[text-[var(--text-muted)]]">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[text-[var(--text-muted)]]">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[bg-[var(--card)]]">
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getEventTypeBadge(log.event_type)}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{log.event_action}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{log.user_email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {log.resource_type ? (
                        <div>
                          <div>{log.resource_type}</div>
                          <div className="text-[text-[var(--text-muted)]] text-xs">{log.resource_reference || log.resource_id || ''}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusColor(log.status)}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate text-[var(--text-primary)]">
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
          <div className="px-4 py-3 border-t border-[border-[var(--border-default)]] flex items-center justify-between">
            <div className="text-sm text-[text-[var(--text-muted)]]">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-[border-[var(--border-default)]] rounded hover:bg-[bg-[var(--card)]] disabled:opacity-50 text-[var(--text-primary)]"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-[var(--text-primary)]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-[border-[var(--border-default)]] rounded hover:bg-[bg-[var(--card)]] disabled:opacity-50 text-[var(--text-primary)]"
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
