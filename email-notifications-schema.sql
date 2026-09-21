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
ALTER TABLE email_notifications ENABLE ROW LEVEL POLICY;

-- Only admins can read email notification configurations
CREATE POLICY "Admins can read email notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.clerk_user_id = auth.uid()
      AND admins.status = 'ACTIVE'
    )
  );

-- Only admins can insert email notification configurations
CREATE POLICY "Admins can insert email notifications"
  ON email_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.clerk_user_id = auth.uid()
      AND admins.status = 'ACTIVE'
    )
  );

-- Only admins can update email notification configurations
CREATE POLICY "Admins can update email notifications"
  ON email_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.clerk_user_id = auth.uid()
      AND admins.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.clerk_user_id = auth.uid()
      AND admins.status = 'ACTIVE'
    )
  );

-- Only admins can delete email notification configurations
CREATE POLICY "Admins can delete email notifications"
  ON email_notifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.clerk_user_id = auth.uid()
      AND admins.status = 'ACTIVE'
    )
  );

-- Insert default email notification configurations
INSERT INTO email_notifications (event_type, recipient_emails, is_active) VALUES
  ('author_application_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('product_submitted', ARRAY['femiadeleke2020@gmail.com'], true),
  ('course_sale', ARRAY['femiadeleke2020@gmail.com'], true),
  ('withdrawal_request', ARRAY['femiadeleke2020@gmail.com'], true),
  ('course_purchase', ARRAY['femiadeleke2020@gmail.com'], true)
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

CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
