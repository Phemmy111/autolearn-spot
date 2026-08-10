-- Fix Partner Column Names for Growth Engine Redesign
-- This migration updates the partners table to use the correct column names
-- from the growth-engine-redesign-schema.sql

-- 1. Add new columns if they don't exist
DO $$
BEGIN
  -- Add clerk_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN clerk_user_id TEXT UNIQUE;
  END IF;

  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN full_name TEXT;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN phone TEXT;
  END IF;

  -- Add custom_commission_rate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'custom_commission_rate'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN custom_commission_rate INTEGER;
  END IF;

  -- Add total_payments_initiated column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'total_payments_initiated'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN total_payments_initiated INTEGER DEFAULT 0;
  END IF;

  -- Add total_successful_purchases column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'total_successful_purchases'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN total_successful_purchases INTEGER DEFAULT 0;
  END IF;

  -- Add lifetime_earnings column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'lifetime_earnings'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN lifetime_earnings INTEGER DEFAULT 0;
  END IF;

  -- Add status_changed_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'status_changed_by'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN status_changed_by TEXT;
  END IF;

  -- Add status_changed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'status_changed_at'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN status_changed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add status_change_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'status_change_reason'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN status_change_reason TEXT;
  END IF;

  -- Add community_ambassador_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'community_ambassador_id'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN community_ambassador_id UUID UNIQUE;
  END IF;

  -- Add influencer_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'influencer_id'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN influencer_id UUID UNIQUE;
  END IF;
END $$;

-- 2. Migrate data from old columns to new columns if old columns exist
DO $$
BEGIN
  -- If user_id exists, migrate to clerk_user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'user_id'
  ) THEN
    UPDATE partners 
    SET clerk_user_id = user_id 
    WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
  END IF;

  -- If user_email exists, migrate to email
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'user_email'
  ) THEN
    UPDATE partners 
    SET email = user_email 
    WHERE email IS NULL AND user_email IS NOT NULL;
  END IF;

  -- If user_name exists, migrate to full_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'user_name'
  ) THEN
    UPDATE partners 
    SET full_name = user_name 
    WHERE full_name IS NULL AND user_name IS NOT NULL;
  END IF;
END $$;

-- 3. Update available_earnings and pending_earnings to be INTEGER instead of DECIMAL
DO $$
BEGIN
  -- Check if columns are DECIMAL and convert to INTEGER
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'available_earnings'
    AND data_type = 'numeric'
  ) THEN
    ALTER TABLE partners 
    ALTER COLUMN available_earnings TYPE INTEGER USING CAST(available_earnings AS INTEGER);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'pending_earnings'
    AND data_type = 'numeric'
  ) THEN
    ALTER TABLE partners 
    ALTER COLUMN pending_earnings TYPE INTEGER USING CAST(pending_earnings AS INTEGER);
  END IF;
END $$;

-- 4. Create unique constraint on clerk_user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partners_clerk_user_id_key'
  ) THEN
    ALTER TABLE partners 
    ADD CONSTRAINT partners_clerk_user_id_key UNIQUE (clerk_user_id);
  END IF;
END $$;

-- 5. Create foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partners_referral_code_id_fkey'
  ) THEN
    ALTER TABLE partners 
    ADD CONSTRAINT partners_referral_code_id_fkey 
    FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Ensure referral_codes table has proper columns
DO $$
BEGIN
  -- Add owner_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_codes' 
    AND column_name = 'owner_type'
  ) THEN
    ALTER TABLE referral_codes 
    ADD COLUMN owner_type TEXT CHECK (owner_type IN ('student', 'community', 'influencer'));
  END IF;

  -- Add total_registrations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_codes' 
    AND column_name = 'total_registrations'
  ) THEN
    ALTER TABLE referral_codes 
    ADD COLUMN total_registrations INTEGER DEFAULT 0;
  END IF;
END $$;

-- 7. Set default values for owner_type where it's NULL
UPDATE referral_codes 
SET owner_type = 'student' 
WHERE owner_type IS NULL;

-- 8. Fix referral_codes owner_id to use partner.id instead of email for consistency
-- This is a more complex migration that should be done carefully
-- For now, we'll leave it as is since the current system uses email as owner_id

COMMIT;
