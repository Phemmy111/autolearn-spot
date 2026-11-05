'use client';

/**
 * components/analytics/TrackViewContent.tsx
 * Client-side ViewContent event dispatcher for published learning products.
 *
 * Prevents duplicate firing on rerenders using a ref guard.
 */

import { useEffect, useRef } from 'react';
import { fbqViewContent } from '@/lib/meta-pixel';

interface TrackViewContentProps {
  product: {
    id: string;
    title: string;
    price: number;
    currency?: string;
    category?: string;
  };
}

export function TrackViewContent({ product }: TrackViewContentProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    fbqViewContent({
      content_id: product.id,
      content_name: product.title,
      content_category: product.category || 'Online Course',
      value: product.price,
      currency: product.currency || 'NGN',
    });
  }, [product.id, product.title, product.price, product.currency, product.category]);

  return null;
}
