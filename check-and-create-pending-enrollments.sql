-- Create pending_enrollments table
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

DROP TRIGGER IF EXISTS pending_enrollments_updated_at ON pending_enrollments;
CREATE TRIGGER pending_enrollments_updated_at
  BEFORE UPDATE ON pending_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_enrollments_updated_at();

-- Row Level Security Policies
ALTER TABLE pending_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Service role can manage pending enrollments" ON pending_enrollments;

-- Allow service role to do everything
CREATE POLICY "Service role can manage pending enrollments"
  ON pending_enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);