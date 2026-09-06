-- migrations/create-cart_items.sql
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  learning_product_id uuid NOT NULL REFERENCES learning_products(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Ensure a cart cannot have duplicate items for the same product
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_product ON cart_items(cart_id, learning_product_id);
