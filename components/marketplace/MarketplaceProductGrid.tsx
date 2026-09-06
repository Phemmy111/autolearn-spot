import { LearningProduct } from '@/types/product';
import { ProductCard } from './ProductCard';

interface MarketplaceProductGridProps {
  products: LearningProduct[];
}

export function MarketplaceProductGrid({ products }: MarketplaceProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <section id="products" className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Featured Courses & Skills</h2>
          <div className="bg-card border border-border rounded-2xl p-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-medium text-foreground mb-2">Check back soon!</h3>
            <p className="text-muted-foreground">Our creators are currently building amazing new learning products. New skills will be available shortly.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-16 md:py-24 bg-muted/10 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Our Featured Products</h2>
            <p className="text-muted-foreground">Practical, in-demand skills taught by industry experts.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {/* Phase 5A Stub Tabs */}
            {['All', 'Courses', 'Digital Products', 'Masterclasses'].map((tab, i) => (
              <button 
                key={tab} 
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === 0 
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
