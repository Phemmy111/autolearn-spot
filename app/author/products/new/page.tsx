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
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white rounded-2xl shadow-sm border border-neutral-200">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">Create New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title</label>
          <input required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Short Description</label>
          <textarea required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Description</label>
          <textarea required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" rows={5} value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Product Type</label><input required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={productType} onChange={(e) => setProductType(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Category</label><input required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Skill ID</label><input required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={skill} onChange={(e) => setSkill(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Difficulty</label><input required className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Price (₦)</label><input type="number" min="0" className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Currency</label><input className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
          <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Access Duration (days)</label><input type="number" min="0" className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={accessDuration} onChange={(e) => setAccessDuration(e.target.value)} /></div>
        </div>
        <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Learning Outcomes</label><textarea className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={learningOutcomes} onChange={(e) => setLearningOutcomes(e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Requirements</label><textarea className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={requirements} onChange={(e) => setRequirements(e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Target Audience</label><textarea className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-neutral-700 mb-1.5">Thumbnail (optional)</label><input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} /></div>
        <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
          {submitting ? 'Creating…' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
