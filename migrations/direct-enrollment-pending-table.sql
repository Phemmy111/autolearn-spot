-- Pending Enrollment Table for Direct Enrollment Flow
-- This stores enrollment data before payment is completed
-- Ensures no user data is lost during payment process

CREATE TABLE IF NOT EXISTS pending_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  state TEXT NOT NULL,
  occupation TEXT NOT NULL,
  gender TEXT NOT NULL,
  referral_source TEXT,
  
  -- Referral Information
  referral_code TEXT,
  referred_by UUID REFERENCES partners(id) ON DELETE SET NULL,
  
  -- Payment Information
  payment_reference TEXT UNIQUE, -- Paystack reference
  payment_amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, expired
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_email ON pending_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_referral_code ON pending_enrollments(referral_code);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_payment_reference ON pending_enrollments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_payment_status ON pending_enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_expires_at ON pending_enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_referred_by ON pending_enrollments(referred_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pending_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pending_enrollments_updated_at
  BEFORE UPDATE ON pending_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_enrollments_updated_at();

-- Row Level Security Policies
ALTER TABLE pending_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can manage pending enrollments"
  ON pending_enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow read access for authenticated users (limited to their own email)
CREATE POLICY "Users can read their own pending enrollment"
  ON pending_enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND email = (SELECT email FROM users WHERE id = auth.uid()));

-- Function to check and expire pending enrollments
CREATE OR REPLACE FUNCTION expire_pending_enrollments()
RETURNS void AS $$
BEGIN
  UPDATE pending_enrollments
  SET payment_status = 'expired',
      updated_at = NOW()
  WHERE payment_status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old expired enrollments (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_expired_pending_enrollments()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_enrollments
  WHERE payment_status = 'expired'
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE pending_enrollments IS 'Stores pending enrollment data for Direct Enrollment flow before payment completion';
COMMENT ON COLUMN pending_enrollments.email IS 'Unique identifier for the pending enrollment';
COMMENT ON COLUMN pending_enrollments.payment_reference IS 'Paystack payment reference number';
COMMENT ON COLUMN pending_enrollments.payment_status IS 'pending, completed, failed, or expired';
COMMENT ON COLUMN pending_enrollments.expires_at IS 'When the pending enrollment expires (24 hours after creation)';
COMMENT ON COLUMN pending_enrollments.referral_code IS 'Referral code used by the user (if any)';
COMMENT ON COLUMN pending_enrollments.referred_by IS 'Partner ID who referred this user (if any)';