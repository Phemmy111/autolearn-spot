'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { 
  getAuditLogs, 
  getAuditLogsCount,
  EventType,
  EventCategory,
  EventStatus 
} from '@/lib/audit-logging';

export interface LogFilters {
  event_type?: EventType;
  event_category?: EventCategory;
  user_email?: string;
  resource_type?: string;
  resource_id?: string;
  status?: EventStatus;
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

export async function getAuditLogsWithPagination(
  filters: LogFilters,
  page: number = 1,
  pageSize: number = 50
) {
  await requireAdmin();
  
  try {
    const offset = (page - 1) * pageSize;
    
    const logs = await getAuditLogs({
      ...filters,
      limit: pageSize,
      offset,
    });
    
    const count = await getAuditLogsCount(filters);
    
    return {
      logs,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

export async function exportAuditLogsToCSV(filters: LogFilters) {
  await requireAdmin();
  
  try {
    // Fetch all logs without pagination
    const logs = await getAuditLogs({
      ...filters,
      limit: 10000, // Reasonable limit for export
    });
    
    // Convert to CSV
    const headers = [
      'ID',
      'Event Type',
      'Event Category',
      'Event Action',
      'User Email',
      'User Role',
      'Resource Type',
      'Resource ID',
      'Resource Reference',
      'Description',
      'Status',
      'Error Message',
      'IP Address',
      'Created At',
    ];
    
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.event_type,
        log.event_category,
        log.event_action,
        log.user_email || '',
        log.user_role || '',
        log.resource_type || '',
        log.resource_id || '',
        log.resource_reference || '',
        `"${log.description.replace(/"/g, '""')}"`,
        log.status,
        log.error_message || '',
        log.ip_address || '',
        log.created_at,
      ].join(',')),
    ];
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw new Error('Failed to export audit logs');
  }
}

export async function getLogStatistics() {
  await requireAdmin();
  
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('event_type, status')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      byEventType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recent: data.slice(0, 10),
    };
    
    data.forEach(log => {
      stats.byEventType[log.event_type] = (stats.byEventType[log.event_type] || 0) + 1;
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to fetch log statistics:', error);
    throw new Error('Failed to fetch log statistics');
  }
}
