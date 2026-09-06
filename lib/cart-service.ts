/**
 * lib/cart-service.ts
 * Server-side cart management for Phase 4 marketplace checkout.
 *
 * All pricing is resolved server-side from learning_products.price.
 * No client-supplied prices are trusted.
 */

import { supabaseAdmin } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartProduct {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  product_type: string;
  author_id: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  learning_product_id: string;
  created_at: string;
  learning_products: CartProduct;
}

export interface CartDetails {
  id: string;
  user_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
  items: CartItemRow[];
  subtotal: number;
  item_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get or create a cart for the given Clerk userId.
 * Currency defaults to 'NGN'. Once set it must be consistent across all items.
 */
export async function createOrGetCart(
  userId: string,
  currency: string = 'NGN'
): Promise<{ id: string; currency: string } | null> {
  // Try existing cart
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('carts')
    .select('id, currency')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.error('cart-service: error fetching cart', fetchErr);
    return null;
  }

  if (existing) return existing;

  // Create new cart
  const { data: created, error: createErr } = await supabaseAdmin
    .from('carts')
    .insert({ user_id: userId, currency })
    .select('id, currency')
    .single();

  if (createErr) {
    console.error('cart-service: error creating cart', createErr);
    return null;
  }

  return created;
}

/**
 * Fetch cart with items + server-side subtotal for a given userId.
 */
export async function getCartDetails(userId: string): Promise<CartDetails | null> {
  const { data: cart, error: cartErr } = await supabaseAdmin
    .from('carts')
    .select('id, user_id, currency, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (cartErr) {
    console.error('cart-service: getCartDetails cart error', cartErr);
    return null;
  }

  if (!cart) {
    // No cart yet — return empty shell
    return {
      id: '',
      user_id: userId,
      currency: 'NGN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      subtotal: 0,
      item_count: 0,
    };
  }

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      cart_id,
      learning_product_id,
      created_at,
      learning_products (
        id,
        title,
        slug,
        thumbnail_url,
        price,
        currency,
        product_type,
        author_id
      )
    `)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (itemsErr) {
    console.error('cart-service: getCartDetails items error', itemsErr);
    return null;
  }

  const rows = (items ?? []) as unknown as CartItemRow[];
  const subtotal = rows.reduce((sum, row) => sum + (row.learning_products?.price ?? 0), 0);

  return {
    ...cart,
    items: rows,
    subtotal,
    item_count: rows.length,
  };
}

/**
 * Add a product to the cart.
 * Enforces:
 * - Product must exist and be PUBLISHED/ACTIVE (purchasable).
 * - Product currency must match cart currency.
 * - Duplicate items are silently accepted (unique constraint handles them).
 *
 * Returns the newly inserted cart_item id, or null on error.
 */
export async function addProductToCart(
  userId: string,
  learningProductId: string
): Promise<{ success: true; cartItemId: string } | { success: false; error: string; status: number }> {
  // Fetch product
  const { data: product, error: productErr } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, currency, price, status')
    .eq('id', learningProductId)
    .maybeSingle();

  if (productErr || !product) {
    return { success: false, error: 'Product not found', status: 404 };
  }

  // Only allow purchasable products
  const purchasableStatuses = ['PUBLISHED', 'ACTIVE'];
  if (!purchasableStatuses.includes(product.status)) {
    return { success: false, error: 'Product is not available for purchase', status: 422 };
  }

  // Get or create cart
  const cart = await createOrGetCart(userId, product.currency);
  if (!cart) {
    return { success: false, error: 'Failed to create or retrieve cart', status: 500 };
  }

  // Enforce currency consistency
  if (cart.currency !== product.currency) {
    return {
      success: false,
      error: `Currency mismatch: cart is ${cart.currency}, product is ${product.currency}`,
      status: 422,
    };
  }

  // Insert (unique constraint prevents duplicates; ON CONFLICT DO NOTHING)
  const { data: item, error: insertErr } = await supabaseAdmin
    .from('cart_items')
    .upsert(
      { cart_id: cart.id, learning_product_id: learningProductId },
      { onConflict: 'cart_id,learning_product_id', ignoreDuplicates: true }
    )
    .select('id')
    .maybeSingle();

  if (insertErr) {
    console.error('cart-service: addProductToCart insert error', insertErr);
    return { success: false, error: 'Failed to add product to cart', status: 500 };
  }

  // Update cart updated_at
  await supabaseAdmin
    .from('carts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cart.id);

  return { success: true, cartItemId: item?.id ?? '' };
}

/**
 * Remove a specific item from the cart.
 * Verifies ownership before deletion.
 */
export async function removeCartItem(
  userId: string,
  cartItemId: string
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  // Verify ownership via join
  const { data: item, error: fetchErr } = await supabaseAdmin
    .from('cart_items')
    .select('id, carts!inner(user_id)')
    .eq('id', cartItemId)
    .maybeSingle();

  if (fetchErr || !item) {
    return { success: false, error: 'Cart item not found', status: 404 };
  }

  const owner = (item as any).carts?.user_id;
  if (owner !== userId) {
    return { success: false, error: 'Forbidden', status: 403 };
  }

  const { error: deleteErr } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (deleteErr) {
    console.error('cart-service: removeCartItem delete error', deleteErr);
    return { success: false, error: 'Failed to remove cart item', status: 500 };
  }

  return { success: true };
}

/**
 * Clear all items from a user's cart (called after successful payment).
 */
export async function clearCartItems(userId: string): Promise<void> {
  const { data: cart } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!cart) return;

  await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);

  await supabaseAdmin
    .from('carts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cart.id);
}
