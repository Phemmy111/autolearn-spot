-- Create partner_notifications table if it doesn't exist
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id ON partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_read ON partner_notifications(read);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_created_at ON partner_notifications(created_at);

-- Enable Row Level Security
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;