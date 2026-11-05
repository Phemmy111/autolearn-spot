'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { fbqAddToCart } from '@/lib/meta-pixel';

type AddToCartButtonProps = {
  productId: string;
  productTitle?: string;
  price?: number;
  currency?: string;
};

export default function AddToCartButton({
  productId,
  productTitle,
  price,
  currency = 'NGN',
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error || 'Failed to add to cart');
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
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="group relative flex items-center justify-center gap-2 w-full bg-foreground text-background font-semibold py-3.5 px-4 rounded-xl hover:bg-foreground/90 hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
      >
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        )}
        <span>{loading ? 'Adding...' : 'Add to Cart'}</span>
      </button>
      {error && (
        <p className="text-sm text-destructive font-medium mt-2 text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
