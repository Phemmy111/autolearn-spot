import { getPublishedProducts } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { AffiliateRefCapture } from '@/components/affiliate/AffiliateRefCapture';

/**
 * Marketplace Landing Page
 * 
 * Displays all published learning products.
 */
export default async function MarketplacePage() {
  const publishedProducts = await getPublishedProducts();

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Capture ?ref= affiliate codes from URL */}
      <Suspense fallback={null}>
        <AffiliateRefCapture />
      </Suspense>
      {/* Header */}
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="container mx-auto px-6 lg:px-12 py-8 pt-24">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-brand-text/60">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-brand-primary transition-colors font-medium">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-brand-text font-semibold">Marketplace</span>
          </div>

          <h1 className="text-3xl font-bold text-brand-text mb-2">
            Marketplace
          </h1>
          <p className="text-brand-text/70">
            Discover premium digital skills courses and masterclasses
          </p>
        </div>
      </div>

      <MarketplaceProductGrid products={publishedProducts} />
    </div>
  );
}
