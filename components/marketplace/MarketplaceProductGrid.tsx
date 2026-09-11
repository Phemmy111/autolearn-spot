import { LearningProduct } from '@/types/product';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, BookOpen } from 'lucide-react';

interface MarketplaceProductGridProps {
  products: LearningProduct[];
}

export function MarketplaceProductGrid({ products }: MarketplaceProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <section id="products" className="py-24 bg-[#e5e9ed]">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-neutral-300/50 mb-6 shadow-sm">
            <BookOpen className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-neutral-900 mb-4 tracking-tight">Curating Excellence</h2>
          <div className="max-w-md mx-auto">
            <p className="text-neutral-600 leading-relaxed">
              Our creators are currently building amazing new learning experiences. Premium skills and courses will be available shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 md:py-32 bg-[#e5e9ed] border-t border-neutral-300/50">
      <div className="container mx-auto px-4">
        
        {/* Header & Search/Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-neutral-900 mb-4 tracking-tight">
              Featured Learning Experiences
            </h2>
            <p className="text-lg text-neutral-600">
              Practical, in-demand skills taught by industry experts to accelerate your growth.
            </p>
          </div>
          
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-neutral-300/50 shadow-sm">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-neutral-900 placeholder:text-neutral-400"
                  disabled
                />
              </div>
              <button className="flex items-center justify-center p-2.5 bg-neutral-100 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Visual Only) */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-8 hide-scrollbar scroll-smooth">
          {['All Products', 'Masterclasses', 'Cohorts', 'Digital Downloads'].map((tab, i) => (
            <button 
              key={tab} 
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                i === 0 
                  ? 'bg-neutral-900 text-white shadow-md' 
                  : 'bg-white border border-neutral-300/50 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
