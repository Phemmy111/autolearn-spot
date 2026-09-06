-- migrations/create-carts.sql
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
