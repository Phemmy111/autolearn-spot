'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

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
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const [cart, setCart] = useState<CartResponse['cart'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        setError('Please sign in to view your cart.');
        setLoading(false);
        return;
      }
      fetchCart();
    }
  }, [isLoaded, isSignedIn]);

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
    setRemovingId(itemId);
    try {
      const token = await getToken({ template: 'integration' });
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      
      // Optimistic update
      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
        subtotal: prev.subtotal - (prev.items.find(i => i.id === itemId)?.learning_product.price || 0)
      } : null);
      
    } catch (e) {
      setError((e as Error).message);
      fetchCart(); // rollback on error
    } finally {
      setRemovingId(null);
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const token = await getToken({ template: 'integration' });
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { authorization_url } = await res.json();
      window.location.href = authorization_url;
    } catch (e) {
      setError((e as Error).message);
      setCheckingOut(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-3xl font-heading font-bold mb-8">Shopping Cart</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border bg-card animate-pulse">
                  <div className="w-32 h-24 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-border bg-card p-6 h-64 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-24 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-destructive/10 text-destructive items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-24">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-8 animate-in zoom-in duration-500">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Looks like you haven't added any learning products yet. Discover your next skill today.
          </p>
          <Link 
            href="/#products" 
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 transition-colors shadow-lg shadow-black/5"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold mb-8 tracking-tight text-foreground">
          Shopping Cart
          <span className="text-muted-foreground text-xl font-normal ml-3">
            ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
          </span>
        </h1>
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div 
                  key={item.id} 
                  className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 rounded-3xl border border-border bg-card transition-all duration-300 hover:border-brand-primary/30 ${removingId === item.id ? 'opacity-50 scale-95' : ''}`}
                >
                  <Link href={`/learning_products/${item.learning_product.id}`} className="relative w-full sm:w-40 aspect-video sm:aspect-auto rounded-xl overflow-hidden bg-muted shrink-0 block">
                    {item.learning_product.thumbnail_url ? (
                      <Image
                        src={item.learning_product.thumbnail_url}
                        alt={item.learning_product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1 flex flex-col py-1">
                    <Link href={`/learning_products/${item.learning_product.id}`} className="hover:text-brand-primary transition-colors">
                      <h3 className="font-heading font-bold text-lg text-foreground line-clamp-2 mb-1">
                        {item.learning_product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expert Instructor
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <p className="font-bold text-lg text-foreground">
                        {formatPrice(item.learning_product.price, item.learning_product.currency)}
                      </p>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={removingId === item.id}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors p-2 -mr-2"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-xl font-heading font-bold text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm text-muted-foreground border-b border-border/50 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(cart.subtotal, cart.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {formatPrice(cart.subtotal, cart.currency)}
                </span>
              </div>
              
              <button
                onClick={checkout}
                disabled={checkingOut}
                className="group flex items-center justify-center gap-2 w-full bg-brand-primary text-primary-foreground font-semibold py-4 px-4 rounded-2xl hover:bg-brand-primary-hover transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(var(--color-brand-primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--color-brand-primary),0.23)] hover:-translate-y-0.5"
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Checkout Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-border/50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Secure encrypted checkout
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
