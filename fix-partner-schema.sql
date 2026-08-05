-- Fix Partner System Database Schema
-- This script creates all necessary tables and columns for the partner system

-- 1. Create partner_marketing_downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS partner_marketing_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'flyer',
  category TEXT DEFAULT 'general',
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add partner_id column to partners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN partner_id TEXT UNIQUE;
  END IF;
END $$;

-- 3. Create partner_bank_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS partner_bank_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'savings',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create partner_referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'clicked',
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add additional columns to partners table if they don't exist
DO $$
BEGIN
  -- Add total_clicks column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'total_clicks'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN total_clicks INTEGER DEFAULT 0;
  END IF;

  -- Add total_registrations column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'total_registrations'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN total_registrations INTEGER DEFAULT 0;
  END IF;

  -- Add available_earnings column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'available_earnings'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN available_earnings DECIMAL(10, 2) DEFAULT 0;
  END IF;

  -- Add pending_earnings column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'pending_earnings'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN pending_earnings DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 6. Create indexes for better performance (only if columns exist)
DO $$
BEGIN
  -- Create index on type column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_marketing_downloads' 
    AND column_name = 'type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_partner_marketing_downloads_type ON partner_marketing_downloads(type);
  END IF;
END $$;

-- Only create these indexes if the tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_bank_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_partner_bank_profiles_partner_id ON partner_bank_profiles(partner_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_referrals') THEN
    CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_id ON partner_referrals(partner_id);
    CREATE INDEX IF NOT EXISTS idx_partner_referrals_code ON partner_referrals(referral_code);
  END IF;
END $$;

-- 7. Create commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES partner_referrals(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  holding_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only create commissions indexes if the table and columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
    -- Only create referrer_id index if column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'commissions' 
      AND column_name = 'referrer_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_commissions_referrer_id ON commissions(referrer_id);
    END IF;
    
    -- Only create referee_id index if column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'commissions' 
      AND column_name = 'referee_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_commissions_referee_id ON commissions(referee_id);
    END IF;
    
    -- Only create status index if column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'commissions' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
    END IF;
  END IF;
END $$;

-- 8. Add Row Level Security (RLS) policies (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_marketing_downloads') THEN
    ALTER TABLE partner_marketing_downloads ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_bank_profiles') THEN
    ALTER TABLE partner_bank_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_referrals') THEN
    ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
    ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Grant access (adjust as needed for your setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;