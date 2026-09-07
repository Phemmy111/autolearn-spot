'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';

type AddToCartButtonProps = {
  productId: string;
};

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
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
        body: JSON.stringify({ learningProductId: productId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add to cart');
      }
      router.refresh();
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
