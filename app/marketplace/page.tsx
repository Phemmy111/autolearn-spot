import { getPublishedProducts } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';

/**
 * Marketplace Landing Page
 * 
 * Displays all published learning products.
 */
export default async function MarketplacePage() {
  const publishedProducts = await getPublishedProducts();

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="container mx-auto px-6 lg:px-12 py-8 pt-24">
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
