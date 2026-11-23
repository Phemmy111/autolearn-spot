'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  Plus, 
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { fbqInitiateCheckout } from '@/lib/meta-pixel';

interface CartItem {
  id: string; // cart item id
  learning_product_id: string;
  quantity: number;
  learning_products: {
    id: string;
    title: string;
    thumbnail_url?: string;
    price: number;
    currency: string;
  };
}

interface BumpProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  thumbnail_url?: string;
  slug?: string;
}

interface CartResponse {
  cart: {
    items: CartItem[];
    subtotal: number;
    currency: string;
  };
  recommendations?: BumpProduct[];
}

export default function CartPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [cart, setCart] = useState<CartResponse['cart'] | null>(null);
  const [recommendations, setRecommendations] = useState<BumpProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingBumpId, setAddingBumpId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !guestName) {
      const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (name) setGuestName(name);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      fetchCart();
    }
  }, [isLoaded, isSignedIn]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = (await res.json()) as CartResponse;
      setCart(data.cart);
      setRecommendations(data.recommendations || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove item');
      
      // Refresh cart
      await fetchCart();
    } catch (e) {
      setError((e as Error).message);
      fetchCart();
    } finally {
      setRemovingId(null);
    }
  };

  const addBumpToCart = async (productId: string) => {
    setAddingBumpId(productId);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningProductId: productId }),
      });
      if (!res.ok) throw new Error('Failed to add product to cart');
      await fetchCart();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingBumpId(null);
    }
  };

  const checkout = async () => {
    if (!isSignedIn && !guestEmail) {
      setError('Please provide an email address to checkout.');
      return;
    }
    if (!guestName || guestName.trim().length === 0) {
      setError('Please enter your full name for your certificate.');
      return;
    }
    setCheckingOut(true);
    setError(null);

    try {
      let refValue: string | undefined;
      try {
        const affiliateRef = typeof window !== 'undefined' ? localStorage.getItem('affiliate_ref') : null;
        if (affiliateRef) {
          const parsed = JSON.parse(affiliateRef);
          refValue = parsed?.code || parsed;
        }
      } catch {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('affiliate_ref') : null;
        if (raw) refValue = raw;
      }

      // Cookie fallback for mobile & private browsing
      if (!refValue && typeof document !== 'undefined') {
        const cookieRow = document.cookie
          .split('; ')
          .find((row) => row.startsWith('affiliate_ref=') || row.startsWith('referral_code=') || row.startsWith('als_referral='));
        if (cookieRow) {
          refValue = decodeURIComponent(cookieRow.split('=')[1] || '');
        }
      }
      
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: !isSignedIn ? guestEmail : undefined,
          fullName: guestName.trim(),
          affiliate_ref: refValue
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Checkout failed');
      }

      if (data?.authorization_url) {
        fbqInitiateCheckout({
          contents: cart?.items?.map((item) => ({
            id: item.learning_product_id,
            quantity: item.quantity || 1,
            item_price: item.learning_products?.price || 0,
            title: item.learning_products?.title,
          })),
          content_ids: cart?.items?.map((item) => item.learning_product_id),
          num_items: cart?.items?.length || 1,
          value: cart?.subtotal || 0,
          currency: cart?.currency || 'NGN',
        });
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No payment authorization URL returned');
      }
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

  if (error && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-background py-24 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-destructive/10 text-destructive items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={fetchCart}
          className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-semibold hover:bg-foreground/90"
        >
          Try Again
        </button>
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
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div 
                  key={item.id} 
                  className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 rounded-3xl border border-border bg-card transition-all duration-300 hover:border-brand-primary/30 ${removingId === item.id ? 'opacity-50 scale-95' : ''}`}
                >
                  <Link href={`/learning_products/${item.learning_products.id}`} className="relative w-full sm:w-36 aspect-video sm:aspect-auto rounded-xl overflow-hidden bg-muted shrink-0 block">
                    {item.learning_products.thumbnail_url ? (
                      <Image
                        src={item.learning_products.thumbnail_url}
                        alt={item.learning_products.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <Link href={`/learning_products/${item.learning_products.id}`} className="hover:text-brand-primary transition-colors">
                        <h3 className="font-heading font-bold text-base md:text-lg text-foreground line-clamp-2 mb-1">
                          {item.learning_products.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Lifetime Access • Certificate Included
                      </p>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                      <p className="font-extrabold text-lg text-foreground">
                        {formatPrice(item.learning_products.price, item.learning_products.currency)}
                      </p>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={removingId === item.id}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Bump / Companion Recommendation */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-2 border-dashed border-amber-500/30 rounded-3xl p-5 md:p-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Frequently Added Together
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                    Special Offer
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Boost your learning curve by adding this companion course to your order in 1 click.
                </p>

                <div className="space-y-3">
                  {recommendations.slice(0, 2).map((bump) => (
                    <div 
                      key={bump.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {bump.thumbnail_url && (
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                            <Image src={bump.thumbnail_url} alt={bump.title} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">{bump.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {bump.description || 'Hands-on project masterclass with verified certification.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => addBumpToCart(bump.id)}
                        disabled={addingBumpId === bump.id}
                        className="shrink-0 w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {addingBumpId === bump.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to Cart ({formatPrice(bump.price, bump.currency)})
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xl shadow-black/5">
              <h2 className="text-xl font-heading font-bold text-foreground mb-5">Checkout & Enrollment</h2>

              {/* Student Identification Form */}
              <div className="space-y-4 mb-6 pb-6 border-b border-border/50 text-left">
                {!isSignedIn && (
                  <p className="text-xs text-muted-foreground">
                    Checking out as guest. We'll automatically set up your student access.
                  </p>
                )}
                {isSignedIn && (
                  <p className="text-xs text-muted-foreground">
                    Confirm your certificate name below:
                  </p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Student Full Name <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Precious Adeleke" 
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-primary transition-colors"
                    required
                  />
                </div>

                {!isSignedIn && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. you@gmail.com" 
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-3 mb-6 text-sm text-muted-foreground border-b border-border/50 pb-5">
                <div className="flex justify-between">
                  <span>Course Subtotal</span>
                  <span className="text-foreground font-medium">{formatPrice(cart.subtotal, cart.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Certificate & Community</span>
                  <span className="font-semibold">FREE</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-foreground">Total Due</span>
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {formatPrice(cart.subtotal, cart.currency)}
                </span>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}
              
              <button
                onClick={checkout}
                disabled={checkingOut}
                className="group flex items-center justify-center gap-2 w-full bg-brand-primary text-primary-foreground font-bold py-4 px-4 rounded-2xl hover:bg-brand-primary-hover transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(var(--color-brand-primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--color-brand-primary),0.23)] hover:-translate-y-0.5"
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Pay & Enroll Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* WhatsApp Payment Support Button */}
              <a
                href="https://chat.whatsapp.com/JGZhpVPwZnr9WViOzkMFHy?s=cl&p=a&iam=2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold transition-colors mt-3 text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Prefer paying via Direct Bank Transfer? Chat on WhatsApp
              </a>

              <div className="mt-5 pt-5 border-t border-border/50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  Secured by Paystack • Instant Automated Enrollment
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
