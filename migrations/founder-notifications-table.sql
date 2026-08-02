-- Founder Notifications Table
-- Stores all notifications sent to the founder for important business events

CREATE TABLE IF NOT EXISTS founder_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Notification Details
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'sent', -- sent, failed, read
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'new_registration',
    'payment_received',
    'scholarship_payment',
    'partner_application',
    'partner_approved',
    'influencer_created',
    'withdrawal_request',
    'withdrawal_paid',
    'fraud_alert',
    'webhook_failure',
    'email_failure',
    'system_error'
  )),
  CONSTRAINT valid_status CHECK (status IN ('sent', 'failed', 'read'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_notifications_type ON founder_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_founder_notifications_status ON founder_notifications(status);
CREATE INDEX IF NOT EXISTS idx_founder_notifications_created_at ON founder_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_notifications_read_at ON founder_notifications(read_at);

-- Add comments for documentation
COMMENT ON TABLE founder_notifications IS 'Stores all notifications sent to the founder for important business events';
COMMENT ON COLUMN founder_notifications.notification_type IS 'Type of notification (new_registration, payment_received, etc.)';
COMMENT ON COLUMN founder_notifications.status IS 'Notification status (sent, failed, read)';
COMMENT ON COLUMN founder_notifications.read_at IS 'When the notification was marked as read';