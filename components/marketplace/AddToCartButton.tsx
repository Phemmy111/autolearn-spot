'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className='mt-4 bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-primary-hover disabled:opacity-50'
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
      {error && <p className='text-sm text-red-500 mt-1'>{error}</p>}
    </div>
  );
}
