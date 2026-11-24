'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { fbqAddToCart } from '@/lib/meta-pixel';

type AddToCartButtonProps = {
  productId: string;
  productTitle?: string;
  price?: number;
  formattedPrice?: string;
  currency?: string;
};

export default function AddToCartButton({
  productId,
  productTitle,
  price,
  formattedPrice,
  currency = 'NGN',
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayPrice = formattedPrice || (price ? new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    maximumFractionDigits: 0
  }).format(price) : '');

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningProductId: productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize enrollment');
      }

      // Meta Pixel: Track AddToCart
      const addedItem = data?.cart?.items?.find((i: any) => i.learning_product_id === productId);
      const title = addedItem?.learning_products?.title || productTitle || 'Online Course';
      const itemPrice = addedItem?.learning_products?.price ?? price ?? 0;
      const itemCurrency = addedItem?.learning_products?.currency || currency || 'NGN';

      fbqAddToCart({
        content_id: productId,
        content_name: title,
        value: itemPrice,
        currency: itemCurrency,
      });

      router.push('/cart');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="group relative flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-5 rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden text-base tracking-wide"
      >
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Zap className="w-5 h-5 fill-current text-amber-300 shrink-0" />
        )}
        <span>{loading ? 'Opening Checkout...' : `Enroll Now ${displayPrice ? `• ${displayPrice}` : ''}`}</span>
        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
      </button>

      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Instant Access • Verified Certificate • 30-Day Guarantee</span>
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium mt-2 text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
