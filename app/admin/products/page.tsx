'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Eye, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  currency: string;
  thumbnail_url: string | null;
  product_type: string;
  created_at: string;
  author: {
    name: string;
    email: string;
  };
  skill?: {
    name: string;
    category?: string;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL'
        ? '/api/admin/products'
        : `/api/admin/products?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Marketplace Products</h1>
            <p className="text-brand-text/70 mt-1">Review and manage author learning products</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-6 border border-red-200">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {['PENDING_REVIEW', 'PUBLISHED', 'DRAFT', 'REJECTED', 'SUSPENDED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-sky-600 text-white'
                    : 'bg-brand-bg text-brand-text/70 hover:bg-brand-bg border border-brand-border'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/50" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 w-full sm:w-64 text-brand-text"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-brand-bg border border-brand-border rounded-2xl p-16 text-center">
            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-brand-text mb-2">No products found</h3>
            <p className="text-brand-text/70">
              There are no products matching your current filters.
            </p>
          </div>
        ) : (
          <div className="bg-brand-bg border border-brand-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--card)] brightness-95 border-b border-brand-border">
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Product</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Author</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Type / Skill</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Price</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Date</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-text/70">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--card)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-200 flex-shrink-0 flex items-center justify-center border border-brand-border">
                            {product.thumbnail_url ? (
                              <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-text line-clamp-1">{product.title}</p>
                            <p className="text-xs text-brand-text/60 line-clamp-1">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-brand-text line-clamp-1">{product.author?.name}</p>
                        <p className="text-xs text-brand-text/60">{product.author?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-brand-text">{product.product_type}</p>
                        <p className="text-xs text-brand-text/60">{product.skill?.name || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-brand-text">
                          {product.price > 0 ? `${product.currency} ${product.price.toLocaleString()}` : 'Free'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-text/70">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
