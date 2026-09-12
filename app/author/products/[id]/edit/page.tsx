"use client"\nimport { useState, useEffect } from 'react';
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
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            required
            className="w-full border p-2 rounded"
            value={product.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Short Description</label>
          <textarea
            required
            className="w-full border p-2 rounded"
            value={product.short_description || ''}
            onChange={(e) => handleChange('short_description', e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Full Description</label>
          <textarea
            required
            className="w-full border p-2 rounded"
            rows={5}
            value={product.full_description || ''}
            onChange={(e) => handleChange('full_description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Product Type</label>
            <input
              required
              className="w-full border p-2 rounded"
              value={product.product_type || ''}
              onChange={(e) => handleChange('product_type', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Category</label>
            <input
              required
              className="w-full border p-2 rounded"
              value={product.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Skill ID</label>
            <input
              required
              className="w-full border p-2 rounded"
              value={product.skill_id || ''}
              onChange={(e) => handleChange('skill_id', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Difficulty</label>
            <input
              required
              className="w-full border p-2 rounded"
              value={product.difficulty || ''}
              onChange={(e) => handleChange('difficulty', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Price (₦)</label>
            <input
              type="number"
              min="0"
              className="w-full border p-2 rounded"
              value={product.price ?? 0}
              onChange={(e) => handleChange('price', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-medium">Currency</label>
            <input
              className="w-full border p-2 rounded"
              value={product.currency || ''}
              onChange={(e) => handleChange('currency', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Access Duration (days)</label>
            <input
              type="number"
              min="0"
              className="w-full border p-2 rounded"
              value={product.access_duration_days ?? 0}
              onChange={(e) => handleChange('access_duration_days', Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Learning Outcomes</label>
          <textarea
            className="w-full border p-2 rounded"
            value={product.learning_outcomes || ''}
            onChange={(e) => handleChange('learning_outcomes', e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Requirements</label>
          <textarea
            className="w-full border p-2 rounded"
            value={product.requirements || ''}
            onChange={(e) => handleChange('requirements', e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Target Audience</label>
          <textarea
            className="w-full border p-2 rounded"
            value={product.target_audience || ''}
            onChange={(e) => handleChange('target_audience', e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Thumbnail (optional - replace)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
