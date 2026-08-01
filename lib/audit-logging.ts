import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Event Types
export type EventType = 
  | 'user_activity'
  | 'admin_activity'
  | 'scholarship_lifecycle'
  | 'payment'
  | 'email'
  | 'system_error';

export type EventCategory =
  | 'authentication'
  | 'authorization'
  | 'application_submission'
  | 'status_change'
  | 'payment_received'
  | 'payment_verified'
  | 'email_sent'
  | 'email_failed'
  | 'api_error'
  | 'database_error'
  | 'validation_error'
  | 'webhook_received'
  | 'webhook_processed'
  | 'quiz_submission'
  | 'assignment_submission'
  | 'enrollment'
  | 'certificate_generation';

export type EventStatus = 'success' | 'failure' | 'warning';

// Audit Log Entry Interface
export interface AuditLogEntry {
  event_type: EventType;
  event_category: EventCategory;
  event_action: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  resource_type?: string;
  resource_id?: string;
  resource_reference?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status?: EventStatus;
  error_message?: string;
  error_code?: string;
}

// Scholarship Timeline Entry Interface
export interface TimelineEntry {
  application_id: string;
  reference_number: string;
  from_status?: string;
  to_status: string;
  admin_id?: string;
  admin_email?: string;
  admin_name?: string;
  notes?: string;
  reason?: string;
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /otp/i,
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
];

// Function to redact sensitive data from objects
function redactSensitiveData(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

// Main audit logging function
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Redact sensitive data from metadata
    const safeMetadata = entry.metadata ? redactSensitiveData(entry.metadata) : undefined;

    // Ensure no sensitive data in other fields
    const safeEntry: AuditLogEntry = {
      ...entry,
      metadata: safeMetadata,
      description: redactSensitiveData(entry.description),
      user_email: entry.user_email ? redactSensitiveData(entry.user_email) : undefined,
    };

    await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type: safeEntry.event_type,
        event_category: safeEntry.event_category,
        event_action: safeEntry.event_action,
        user_id: safeEntry.user_id,
        user_email: safeEntry.user_email,
        user_role: safeEntry.user_role,
        resource_type: safeEntry.resource_type,
        resource_id: safeEntry.resource_id,
        resource_reference: safeEntry.resource_reference,
        description: safeEntry.description,
        metadata: safeEntry.metadata,
        ip_address: safeEntry.ip_address,
        user_agent: safeEntry.user_agent,
        status: safeEntry.status || 'success',
        error_message: safeEntry.error_message,
        error_code: safeEntry.error_code,
      });
  } catch (error) {
    // Log to console as fallback, but don't throw to avoid breaking application
    console.error('Failed to log audit event:', error);
    console.error('Audit entry:', JSON.stringify(entry, null, 2));
  }
}

// Scholarship timeline logging function
export async function logScholarshipTimeline(entry: TimelineEntry): Promise<void> {
  try {
    await supabaseAdmin
      .from('scholarship_timeline')
      .insert({
        application_id: entry.application_id,
        reference_number: entry.reference_number,
        from_status: entry.from_status,
        to_status: entry.to_status,
        admin_id: entry.admin_id,
        admin_email: entry.admin_email,
        admin_name: entry.admin_name,
        notes: entry.notes,
        reason: entry.reason,
      });
  } catch (error) {
    // Log to console as fallback, but don't throw to avoid breaking application
    console.error('Failed to log scholarship timeline:', error);
    console.error('Timeline entry:', JSON.stringify(entry, null, 2));
  }
}

// Convenience functions for common event types

export async function logUserActivity(params: {
  action: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}) {
  await logAuditEvent({
    event_type: 'user_activity',
    event_category: 'authentication',
    event_action: params.action,
    user_id: params.user_id,
    user_email: params.user_email,
    user_role: params.user_role,
    description: params.description,
    metadata: params.metadata,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  });
}

export async function logAdminActivity(params: {
  action: string;
  admin_id?: string;
  admin_email?: string;
  admin_role?: string;
  resource_type?: string;
  resource_id?: string;
  resource_reference?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}) {
  await logAuditEvent({
    event_type: 'admin_activity',
    event_category: 'authorization',
    event_action: params.action,
    user_id: params.admin_id,
    user_email: params.admin_email,
    user_role: params.admin_role,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    resource_reference: params.resource_reference,
    description: params.description,
    metadata: params.metadata,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  });
}

export async function logScholarshipEvent(params: {
  action: string;
  category: EventCategory;
  user_email?: string;
  application_id?: string;
  reference_number?: string;
  description: string;
  metadata?: Record<string, any>;
  status?: EventStatus;
  error_message?: string;
}) {
  await logAuditEvent({
    event_type: 'scholarship_lifecycle',
    event_category: params.category,
    event_action: params.action,
    user_email: params.user_email,
    resource_type: 'scholarship_application',
    resource_id: params.application_id,
    resource_reference: params.reference_number,
    description: params.description,
    metadata: params.metadata,
    status: params.status,
    error_message: params.error_message,
  });
}

export async function logPaymentEvent(params: {
  action: string;
  category: EventCategory;
  user_email?: string;
  application_id?: string;
  reference_number?: string;
  payment_reference?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, any>;
  status?: EventStatus;
  error_message?: string;
}) {
  await logAuditEvent({
    event_type: 'payment',
    event_category: params.category,
    event_action: params.action,
    user_email: params.user_email,
    resource_type: 'payment',
    resource_id: params.application_id,
    resource_reference: params.payment_reference,
    description: params.description,
    metadata: {
      ...params.metadata,
      amount: params.amount,
    },
    status: params.status,
    error_message: params.error_message,
  });
}

export async function logEmailEvent(params: {
  action: string;
  recipient_email: string;
  email_type: string;
  subject?: string;
  description: string;
  metadata?: Record<string, any>;
  status?: EventStatus;
  error_message?: string;
}) {
  await logAuditEvent({
    event_type: 'email',
    event_category: params.status === 'failure' ? 'email_failed' : 'email_sent',
    event_action: params.action,
    user_email: params.recipient_email,
    resource_type: 'email',
    description: params.description,
    metadata: {
      ...params.metadata,
      email_type: params.email_type,
      subject: params.subject,
    },
    status: params.status,
    error_message: params.error_message,
  });
}

export async function logSystemError(params: {
  action: string;
  category: EventCategory;
  error_message: string;
  error_code?: string;
  user_id?: string;
  user_email?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}) {
  await logAuditEvent({
    event_type: 'system_error',
    event_category: params.category,
    event_action: params.action,
    user_id: params.user_id,
    user_email: params.user_email,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    description: `System error: ${params.error_message}`,
    metadata: params.metadata,
    status: 'failure',
    error_message: params.error_message,
    error_code: params.error_code,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  });
}

// Query functions for admin dashboard

export async function getAuditLogs(params: {
  event_type?: EventType;
  event_category?: EventCategory;
  user_email?: string;
  resource_type?: string;
  resource_id?: string;
  status?: EventStatus;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.event_type) {
      query = query.eq('event_type', params.event_type);
    }
    if (params.event_category) {
      query = query.eq('event_category', params.event_category);
    }
    if (params.user_email) {
      query = query.eq('user_email', params.user_email);
    }
    if (params.resource_type) {
      query = query.eq('resource_type', params.resource_type);
    }
    if (params.resource_id) {
      query = query.eq('resource_id', params.resource_id);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.start_date) {
      query = query.gte('created_at', params.start_date.toISOString());
    }
    if (params.end_date) {
      query = query.lte('created_at', params.end_date.toISOString());
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
}

export async function getScholarshipTimeline(applicationId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('scholarship_timeline')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch scholarship timeline:', error);
    throw error;
  }
}

export async function getAuditLogsCount(params: {
  event_type?: EventType;
  event_category?: EventCategory;
  user_email?: string;
  resource_type?: string;
  resource_id?: string;
  status?: EventStatus;
  start_date?: Date;
  end_date?: Date;
}) {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (params.event_type) {
      query = query.eq('event_type', params.event_type);
    }
    if (params.event_category) {
      query = query.eq('event_category', params.event_category);
    }
    if (params.user_email) {
      query = query.eq('user_email', params.user_email);
    }
    if (params.resource_type) {
      query = query.eq('resource_type', params.resource_type);
    }
    if (params.resource_id) {
      query = query.eq('resource_id', params.resource_id);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.start_date) {
      query = query.gte('created_at', params.start_date.toISOString());
    }
    if (params.end_date) {
      query = query.lte('created_at', params.end_date.toISOString());
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to fetch audit logs count:', error);
    throw error;
  }
}
