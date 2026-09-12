"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadThumbnail } from '@/lib/supabase-upload';

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('NGN');
  const [accessDuration, setAccessDuration] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [requirements, setRequirements] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let thumbnailUrl = null;
    if (thumbnailFile) {
      thumbnailUrl = await uploadThumbnail(thumbnailFile);
    }
    const payload = {
      title,
      short_description: shortDesc,
      full_description: fullDesc,
      product_type: productType,
      category,
      skill_id: skill,
      difficulty,
      price: Number(price),
      currency,
      access_duration_days: Number(accessDuration),
      learning_outcomes: learningOutcomes,
      requirements,
      target_audience: targetAudience,
      thumbnail: thumbnailUrl,
    };
    try {
      const res = await fetch('/api/author/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create product');
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
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Create New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input required className="w-full border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium">Short Description</label>
          <textarea required className="w-full border p-2 rounded" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium">Full Description</label>
          <textarea required className="w-full border p-2 rounded" rows={5} value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block font-medium">Product Type</label><input required className="w-full border p-2 rounded" value={productType} onChange={(e) => setProductType(e.target.value)} /></div>
          <div><label className="block font-medium">Category</label><input required className="w-full border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div><label className="block font-medium">Skill ID</label><input required className="w-full border p-2 rounded" value={skill} onChange={(e) => setSkill(e.target.value)} /></div>
          <div><label className="block font-medium">Difficulty</label><input required className="w-full border p-2 rounded" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block font-medium">Price (₦)</label><input type="number" min="0" className="w-full border p-2 rounded" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><label className="block font-medium">Currency</label><input className="w-full border p-2 rounded" value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
          <div><label className="block font-medium">Access Duration (days)</label><input type="number" min="0" className="w-full border p-2 rounded" value={accessDuration} onChange={(e) => setAccessDuration(e.target.value)} /></div>
        </div>
        <div><label className="block font-medium">Learning Outcomes</label><textarea className="w-full border p-2 rounded" value={learningOutcomes} onChange={(e) => setLearningOutcomes(e.target.value)} /></div>
        <div><label className="block font-medium">Requirements</label><textarea className="w-full border p-2 rounded" value={requirements} onChange={(e) => setRequirements(e.target.value)} /></div>
        <div><label className="block font-medium">Target Audience</label><textarea className="w-full border p-2 rounded" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} /></div>
        <div><label className="block font-medium">Thumbnail (optional)</label><input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} /></div>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">
          {submitting ? 'Creating…' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
