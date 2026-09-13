import { ShoppingBag, Filter, Search } from 'lucide-react';

/**
 * Marketplace Landing Page
 * 
 * Clean marketplace listing page with placeholder for products.
 * Will be connected to backend data in future phases.
 */
export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-100 border-b border-neutral-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Marketplace
          </h1>
          <p className="text-neutral-600">
            Discover premium digital skills courses
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="container mx-auto px-6 lg:px-12 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-gray-100 transition-colors">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Marketplace Coming Soon
          </h2>
          <p className="text-neutral-600 max-w-md">
            We're curating the best digital skills courses for you. Check back soon to discover our premium course offerings.
          </p>
        </div>
      </div>
    </div>
  );
}
