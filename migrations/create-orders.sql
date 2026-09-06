-- migrations/create-orders.sql
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  order_ref text NOT NULL UNIQUE,
  currency text NOT NULL,
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','PAID','FAILED','CANCELLED')),
  payment_provider text NOT NULL,
  provider_ref text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone
);

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
