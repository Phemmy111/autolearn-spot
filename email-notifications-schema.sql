-- Email Notifications Configuration Table
-- This table stores email notification preferences for different events

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL UNIQUE,
  recipient_emails TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Admins can insert email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Admins can update email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Admins can delete email notifications" ON email_notifications;

-- Only admins can read email notification configurations
CREATE POLICY "Admins can read email notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.email()
      AND admins.is_active = true
    )
  );

-- Only admins can insert email notification configurations
CREATE POLICY "Admins can insert email notifications"
  ON email_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.email()
      AND admins.is_active = true
    )
  );

-- Only admins can update email notification configurations
CREATE POLICY "Admins can update email notifications"
  ON email_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.email()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.email()
      AND admins.is_active = true
    )
  );

-- Only admins can delete email notification configurations
CREATE POLICY "Admins can delete email notifications"
  ON email_notifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.email()
      AND admins.is_active = true
    )
  );

-- Insert default email notification configurations
INSERT INTO email_notifications (event_type, recipient_emails, is_active) VALUES
  ('author_application_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('product_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('course_sale', ARRAY['femiadeleke2020@gmail.com'], true),
  ('withdrawal_request', ARRAY['femiadeleke2020@gmail.com'], true),
  ('course_purchase', ARRAY['femiadeleke2020@gmail.com'], true),
  ('product_published', ARRAY['femiadeleke2020@gmail.com'], true),
  ('product_rejected', ARRAY['femiadeleke2020@gmail.com'], true),
  ('author_suspended', ARRAY['femiadeleke2020@gmail.com'], true),
  ('author_reactivated', ARRAY['femiadeleke2020@gmail.com'], true),
  ('course_completion', ARRAY['femiadeleke2020@gmail.com'], true),
  ('quiz_completion', ARRAY['femiadeleke2020@gmail.com'], true),
  ('assignment_submission', ARRAY['femiadeleke2020@gmail.com'], true),
  ('partner_application_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('scholarship_application_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('new_student_enrollment', ARRAY['femiadeleke2020@gmail.com'], true),
  ('system_alert', ARRAY['femiadeleke2020@gmail.com'], true)
ON CONFLICT (event_type) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_event_type ON email_notifications(event_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_email_notifications_updated_at ON email_notifications;
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
