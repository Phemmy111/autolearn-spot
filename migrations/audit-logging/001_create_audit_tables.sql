-- AutoLearn Spot Audit Logging System Migration
-- Run this in Supabase SQL Editor to create the audit logging tables

-- 1. Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event Classification
    event_type TEXT NOT NULL, -- 'user_activity', 'admin_activity', 'scholarship_lifecycle', 'payment', 'email', 'system_error'
    event_category TEXT NOT NULL, -- More specific categorization
    event_action TEXT NOT NULL, -- Specific action performed
    
    -- User Information
    user_id UUID, -- Clerk user ID if applicable
    user_email TEXT, -- User email (never sensitive data)
    user_role TEXT, -- User role (admin, student, etc.)
    
    -- Resource Information
    resource_type TEXT, -- Type of resource affected
    resource_id UUID, -- ID of the resource affected
    resource_reference TEXT, -- Reference number or external ID
    
    -- Event Details
    description TEXT NOT NULL, -- Human-readable description of the event
    metadata JSONB, -- Additional structured data (never sensitive information)
    ip_address TEXT, -- IP address of the request
    user_agent TEXT, -- Browser/user agent information
    
    -- Status and Error Information
    status TEXT DEFAULT 'success', -- 'success', 'failure', 'warning'
    error_message TEXT, -- Error message if applicable
    error_code TEXT, -- Error code for debugging
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Scholarship Timeline Table
CREATE TABLE IF NOT EXISTS public.scholarship_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to Application
    application_id UUID NOT NULL REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
    reference_number TEXT NOT NULL,
    
    -- Status Transition
    from_status TEXT, -- Previous status (NULL for initial status)
    to_status TEXT NOT NULL, -- New status
    
    -- Admin Information
    admin_id UUID, -- Clerk user ID of admin who made the change
    admin_email TEXT, -- Admin email
    admin_name TEXT, -- Admin name
    
    -- Transition Details
    notes TEXT, -- Notes about the transition
    reason TEXT, -- Reason for the status change
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_timeline ENABLE ROW LEVEL SECURITY;

-- Audit Logs: Only admins can read
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Audit Logs: Service role can insert (for server actions)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Scholarship Timeline: Only admins can read
CREATE POLICY "Admins can read scholarship timeline"
ON public.scholarship_timeline
FOR SELECT
USING (auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'role' = 'admin');

-- Scholarship Timeline: Service role can insert (for server actions)
CREATE POLICY "Service role can insert scholarship timeline"
ON public.scholarship_timeline
FOR INSERT
WITH CHECK (true);

-- 5. Indexes for Performance

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON public.audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_type_date ON public.audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON public.audit_logs(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date ON public.audit_logs(resource_type, resource_id, created_at DESC);

-- Scholarship Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_application_id ON public.scholarship_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_timeline_reference_number ON public.scholarship_timeline(reference_number);
CREATE INDEX IF NOT EXISTS idx_timeline_to_status ON public.scholarship_timeline(to_status);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON public.scholarship_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_admin_email ON public.scholarship_timeline(admin_email);

-- Composite index for application timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_app_date ON public.scholarship_timeline(application_id, created_at DESC);

-- 6. Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Centralized audit logging table for all system events';
COMMENT ON TABLE public.scholarship_timeline IS 'Timeline of scholarship application status changes';
