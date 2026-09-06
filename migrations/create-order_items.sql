-- migrations/create-order_items.sql
-- Snapshot of each product purchased in an order.
-- Prices are captured at checkout time and not affected by future product price changes.
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  learning_product_id uuid NOT NULL REFERENCES learning_products(id),
  product_title text NOT NULL,
  price_snapshot numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast order → items lookup
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
