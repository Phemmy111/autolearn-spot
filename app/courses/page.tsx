import { getPublishedProducts } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const products = await getPublishedProducts();

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="container mx-auto px-6 lg:px-12 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-text">
              All Courses
            </h1>
          </div>
          <p className="text-brand-text/70 max-w-2xl">
            Browse our complete library of expert-led courses and digital resources.
          </p>
        </div>
      </div>

      <MarketplaceProductGrid products={products} />
    </div>
  );
}
