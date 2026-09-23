-- Add customer details to orders table
-- This allows us to display real student names and emails in the author dashboard

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text;

-- Add index for customer email for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
