'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';

interface CartItem {
  id: string; // cart item id
  learning_product_id: string;
  quantity: number;
  learning_product: {
    id: string;
    title: string;
    thumbnail_url?: string;
    price: number;
    currency: string;
  };
}

interface CartResponse {
  cart: {
    items: CartItem[];
    subtotal: number;
    currency: string;
  };
}

export default function CartPage() {
  const { isSignedIn, getToken } = useAuth();
  const [cart, setCart] = useState<CartResponse['cart'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setError('Please sign in to view your cart.');
      setLoading(false);
      return;
    }
    fetchCart();
  }, [isSignedIn]);

  const fetchCart = async () => {
    try {
      const token = await getToken({ template: 'integration' });
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = (await res.json()) as CartResponse;
      setCart(data.cart);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const token = await getToken({ template: 'integration' });
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      // Refresh cart
      fetchCart();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const checkout = async () => {
    try {
      const token = await getToken({ template: 'integration' });
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { authorization_url } = await res.json();
      // Redirect to Paystack
      window.location.href = authorization_url;
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!cart || cart.items.length === 0)
    return <p className="p-4">Your cart is empty.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center border rounded p-2">
            {item.learning_product.thumbnail_url && (
              <Image
                src={item.learning_product.thumbnail_url}
                alt={item.learning_product.title}
                width={80}
                height={60}
                className="rounded mr-4"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.learning_product.title}</p>
              <p className="text-sm text-gray-600">
                {item.learning_product.price} {item.learning_product.currency}
              </p>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-right">
        <p className="text-xl font-semibold mb-2">
          Total: {cart.subtotal} {cart.currency}
        </p>
        <button
          onClick={checkout}
          className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-primary-hover"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
