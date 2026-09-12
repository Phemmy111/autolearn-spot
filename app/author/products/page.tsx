"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Edit, Eye, Trash2, Send, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  skill_id: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'REJECTED' | 'SUSPENDED';
  price: number;
  currency: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export default function AuthorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL'
        ? '/api/author/products'
        : `/api/author/products?status=${filter}`;

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
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const canEdit = (status: string) => status === 'DRAFT' || status === 'UNPUBLISHED';
  const canDelete = (status: string) => status === 'DRAFT';
  const canSubmit = (status: string) => status === 'DRAFT';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-600">Manage your learning products</p>
        </div>
        <Link
          href="/author/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL', 'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SUSPENDED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-sky-600 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No products yet</h3>
          <p className="text-neutral-600 mb-4">
            {filter === 'ALL'
              ? "You haven't created any learning products yet."
              : `No products with status: ${filter.replace('_', ' ')}`}
          </p>
          {filter === 'ALL' && (
            <Link
              href="/author/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-neutral-300" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2">
                  {product.title}
                </h3>

                <p className="text-sm text-neutral-600 mb-3">
                  {product.currency} {product.price.toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {canEdit(product.status) && (
                    <Link
                      href={`/author/products/${product.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  )}

                  {canSubmit(product.status) && (
                    <button
                      onClick={() => handleSubmit(product.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                  )}

                  {product.status === 'PUBLISHED' && (
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  )}

                  {canDelete(product.status) && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function handleSubmit(productId: string) {
  try {
    const response = await fetch(`/api/author/products/${productId}/submit`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Failed to submit product');
      return;
    }

    alert('Product submitted for review successfully!');
    window.location.reload();
  } catch (error) {
    alert('Failed to submit product');
  }
}

async function handleDelete(productId: string) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/author/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      alert('Failed to delete product');
      return;
    }

    alert('Product deleted successfully!');
    window.location.reload();
  } catch (error) {
    alert('Failed to delete product');
  }
}
