-- Migration: Create admin_audit_logs table for recording admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id text NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for quick lookup by admin or action
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- RLS: only service_role can insert/read
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.admin_audit_logs
  FOR ALL USING (true);

GRANT ALL ON public.admin_audit_logs TO service_role;

-- Migration: Add platform_commission_rate to site_settings if not present
INSERT INTO public.site_settings (key, value)
VALUES ('platform_commission_rate', '10')
ON CONFLICT (key) DO NOTHING;
