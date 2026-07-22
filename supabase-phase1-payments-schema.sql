CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  clerk_user_id VARCHAR(255),
  payment_ref VARCHAR(255),
  amount_paid INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  referral_code VARCHAR(100),
  referred_by_code VARCHAR(100),
  invited_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, email)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_email ON enrollments(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_clerk_user ON enrollments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort ON enrollments(cohort_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id BIGINT,
  reference VARCHAR(255) NOT NULL UNIQUE,
  gateway_response TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  amount INTEGER NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  channel VARCHAR(50),
  fees INTEGER,
  status VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  coupon_code VARCHAR(100),
  discount_amount INTEGER DEFAULT 0,
  referral_code VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_reference VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_reference ON payment_events(payment_reference);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
