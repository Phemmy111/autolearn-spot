'use client';

import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ManualEnrollmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch available products
    async function fetchProducts() {
      try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }
    fetchProducts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch('/api/admin/enrollments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Student enrolled successfully!' });
        form.reset();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to enroll student' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-6 bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-brand-text mb-4">Manual Enrollment</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="student@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Product *</label>
          <select
            name="productId"
            required
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Status</label>
          <select
            name="status"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Reason (Optional)</label>
          <input
            type="text"
            name="reason"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Reason for manual enrollment"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
