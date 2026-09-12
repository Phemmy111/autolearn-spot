"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { uploadThumbnail } from '@/lib/supabase-upload';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams(); // product ID from URL
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/author/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data.product);
        } else {
          alert(data.error || 'Failed to load product');
        }
      } catch (e) {
        alert('Network error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  if (!product) {
    return <div className="p-6">Product not found.</div>;
  }

  const handleChange = (field: string, value: any) => {
    setProduct({ ...product, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let thumbnailUrl = product.thumbnail || null;
    if (thumbnailFile) {
      const uploaded = await uploadThumbnail(thumbnailFile);
      if (uploaded) thumbnailUrl = uploaded;
    }
    const payload = {
      ...product,
      thumbnail: thumbnailUrl,
    };
    try {
      const res = await fetch(`/api/author/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update product');
      } else {
        router.push('/author/products');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white rounded-2xl shadow-sm border border-neutral-200">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title</label>
          <input
            required
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            value={product.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Short Description</label>
          <textarea
            required
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            value={product.short_description || ''}
            onChange={(e) => handleChange('short_description', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Description</label>
          <textarea
            required
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            rows={5}
            value={product.full_description || ''}
            onChange={(e) => handleChange('full_description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Product Type</label>
            <input
              required
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.product_type || ''}
              onChange={(e) => handleChange('product_type', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Category</label>
            <input
              required
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Skill ID</label>
            <input
              required
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.skill_id || ''}
              onChange={(e) => handleChange('skill_id', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Difficulty</label>
            <input
              required
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.difficulty || ''}
              onChange={(e) => handleChange('difficulty', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Price (₦)</label>
            <input
              type="number"
              min="0"
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.price ?? 0}
              onChange={(e) => handleChange('price', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Currency</label>
            <input
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.currency || ''}
              onChange={(e) => handleChange('currency', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Access Duration (days)</label>
            <input
              type="number"
              min="0"
              className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
              value={product.access_duration_days ?? 0}
              onChange={(e) => handleChange('access_duration_days', Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Learning Outcomes</label>
          <textarea
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            value={product.learning_outcomes || ''}
            onChange={(e) => handleChange('learning_outcomes', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Requirements</label>
          <textarea
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            value={product.requirements || ''}
            onChange={(e) => handleChange('requirements', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Target Audience</label>
          <textarea
            className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
            value={product.target_audience || ''}
            onChange={(e) => handleChange('target_audience', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Thumbnail (optional - replace)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
