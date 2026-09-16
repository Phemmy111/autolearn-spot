// lib/auditLog.ts
// Admin audit logging helper

import { supabaseAdmin } from '@/lib/supabase';

export interface AdminAuditLogParams {
  adminId: string;
  action: string;
  details?: Record<string, unknown>;
}

/**
 * Log an admin action to the admin_audit_logs table.
 * Falls back gracefully if the table does not exist yet.
 */
export async function logAdminAction({ adminId, action, details }: AdminAuditLogParams): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        details: details ?? {},
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    // Non-fatal: log to console but do not block the primary operation
    console.error('[auditLog] Failed to write audit log entry:', err);
  }
}
